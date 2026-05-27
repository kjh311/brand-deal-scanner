import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { extractText, getDocumentProxy } from "npm:unpdf@latest"
import { Uint8ArrayReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * DOCX Parser (Native ZIP/XML)
 */
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  const reader = new Uint8ArrayReader(uint8Array);
  const zipReader = new ZipReader(reader);
  try {
    const entries = await zipReader.getEntries();
    const documentEntry = entries.find(entry => entry.filename === "word/document.xml");
    if (!documentEntry) throw new Error("Invalid DOCX");
    // @ts-ignore
    const xmlText = await documentEntry.getData(new TextWriter());
    const matches = xmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (!matches) return "";
    return matches.map(match => match.replace(/<[^>]+>/g, '')).join(' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  } finally {
    await zipReader.close();
  }
}

/**
 * Image OCR Parser (Cloud Vision Wrapper)
 * Uses a simple REST call to avoid heavy WASM overhead in Deno isolates.
 */
async function extractTextFromImage(arrayBuffer: ArrayBuffer): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  if (!apiKey) {
    throw new Error("OCR Required: GOOGLE_VISION_API_KEY not set in Edge Function secrets.");
  }

  // Convert buffer to base64 for the API
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION' }]
      }]
    })
  });

  const result = await response.json();
  const text = result?.responses?.[0]?.fullTextAnnotation?.text || "";
  
  if (!text) {
    console.warn("OCR complete but no text was detected in the image.");
  }
  
  return text;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  let recordId: string | null = null

  try {
    const rawText = await req.text();
    const body = JSON.parse(rawText);
    recordId = body.contract_id || body.id || body.record?.id;
    if (!recordId) throw new Error("Missing record ID");

    const { data: record, error: fetchError } = await supabase.from('contracts').select('*').eq('id', recordId).single();
    if (fetchError || !record) throw new Error("Record not found");

    const { source_type, file_path, extracted_text } = record;
    let finalExtractedText = '';

    if (source_type === 'file') {
      const { data: fileBlob, error: downloadError } = await supabase.storage.from('brand-contracts').download(file_path);
      if (downloadError) throw downloadError;
      
      const arrayBuffer = await fileBlob.arrayBuffer();
      const extension = file_path?.split('.').pop()?.toLowerCase();
      const mimeType = fileBlob.type;

      // UNIVERSAL DISPATCHER LOGIC
      const isPdf = extension === 'pdf' || mimeType === 'application/pdf';
      const isDocx = extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isTxt = extension === 'txt' || mimeType === 'text/plain';
      const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '') || mimeType.startsWith('image/');

      console.log(`[${recordId}] Dispatching: ${extension || 'unknown'} (${fileBlob.size} bytes)`);

      try {
        if (isPdf) {
          console.log(`[${recordId}] Logic: PDF (unpdf)`);
          const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
          const result = await extractText(pdf, { mergePages: true });
          finalExtractedText = result.text;
        } 
        else if (isDocx) {
          console.log(`[${recordId}] Logic: DOCX (Native ZIP)`);
          finalExtractedText = await extractTextFromDocx(arrayBuffer);
        } 
        else if (isTxt) {
          console.log(`[${recordId}] Logic: TXT (UTF-8 direct)`);
          finalExtractedText = new TextDecoder().decode(arrayBuffer);
        } 
        else if (isImage) {
          console.log(`[${recordId}] Logic: IMAGE (OCR Vision)`);
          finalExtractedText = await extractTextFromImage(arrayBuffer);
        } 
        else {
          throw new Error(`Unsupported document format: .${extension} / ${mimeType}`);
        }
      } catch (engineErr: any) {
        throw new Error(`Scanner Error: ${engineErr.message}`);
      }
    } else {
      finalExtractedText = extracted_text || '';
    }

    // Success Update
    await supabase.from('contracts').update({ extracted_text: finalExtractedText, status: 'ready' }).eq('id', recordId);
    return new Response(JSON.stringify({ success: true, format: source_type }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(`[${recordId || 'SYS'}] FAIL: ${err.message}`);
    if (recordId) {
      try {
        await supabase.from('contracts').update({ status: 'failed' }).eq('id', recordId);
      } catch { /* Suppress secondary errors */ }
    }
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 });
  }
});
