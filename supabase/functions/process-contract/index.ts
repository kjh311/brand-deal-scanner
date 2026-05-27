import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { extractText, getDocumentProxy } from "npm:unpdf@latest"
import { Uint8ArrayReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  if (uint8Array.length === 0) throw new Error("Empty file buffer");
  
  const reader = new Uint8ArrayReader(uint8Array);
  const zipReader = new ZipReader(reader);
  
  try {
    const entries = await zipReader.getEntries();
    const documentEntry = entries.find(entry => entry.filename === "word/document.xml");
    if (!documentEntry) throw new Error("Invalid DOCX: Missing word/document.xml");

    // @ts-ignore
    const xmlText = await documentEntry.getData(new TextWriter());
    const matches = xmlText.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    if (!matches) return "";
    
    return matches
      .map(match => match.replace(/<[^>]+>/g, ''))
      .join(' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  } finally {
    await zipReader.close();
  }
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

      const isPdf = extension === 'pdf' || mimeType === 'application/pdf';
      const isDocx = extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file_path.endsWith('.docx');

      console.log(`[${recordId}] Processing ${extension} (${fileBlob.size} bytes)`);

      try {
        if (isPdf) {
          // unpdf in Deno typically prefers the Uint8Array directly or mapped precisely
          // We wrap it in a new Uint8Array to ensure neutral binary context
          const pdfData = new Uint8Array(arrayBuffer);
          const pdf = await getDocumentProxy(pdfData); 
          const result = await extractText(pdf, { mergePages: true });
          finalExtractedText = result.text;
        } 
        else if (isDocx) {
          finalExtractedText = await extractTextFromDocx(arrayBuffer);
        } 
        else {
          throw new Error(`Unsupported format: ${extension}`);
        }
      } catch (engineErr: any) {
        throw new Error(`Engine crash: ${engineErr.message}`);
      }
    } else {
      finalExtractedText = extracted_text || '';
    }

    await supabase.from('contracts').update({ extracted_text: finalExtractedText, status: 'ready' }).eq('id', recordId);
    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(`[${recordId || 'SYS'}] FAIL: ${err.message}`);
    if (recordId) {
      try {
        await supabase.from('contracts').update({ status: 'failed' }).eq('id', recordId);
      } catch {
        // Silently ignore secondary failures
      }
    }
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 });
  }
});
