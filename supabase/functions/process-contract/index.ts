import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { extractText, getDocumentProxy } from "npm:unpdf@latest"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Environment configuration error." }), { 
      status: 500, 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  let recordId: string | null = null

  try {
    const rawText = await req.text();
    let body;
    try {
      body = JSON.parse(rawText);
    } catch (e) {
      throw new Error("Invalid JSON payload");
    }

    recordId = body.contract_id || body.record?.id || body.id;
    if (!recordId) throw new Error("Missing record ID");

    console.log(`[${recordId}] Fetching record...`);
    const { data: record, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', recordId)
      .single();

    if (fetchError || !record) throw new Error("Record not found");

    const { source_type, file_path, extracted_text } = record;
    let finalExtractedText = '';

    if (source_type === 'file') {
      console.log(`[${recordId}] Downloading file: ${file_path}`);
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('brand-contracts')
        .download(file_path);

      if (downloadError) throw downloadError;

      const arrayBuffer = await fileBlob.arrayBuffer();
      
      console.log(`[${recordId}] Extracting text using unpdf engine...`);
      
      // 1. Load the PDF document proxy
      const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
      
      // 2. Extract text from all pages
      const result = await extractText(pdf, { mergePages: true });
      finalExtractedText = result.text;
      
      console.log(`[${recordId}] Extraction successful. Pages: ${result.totalPages}, Length: ${finalExtractedText.length}`);
    } else {
      finalExtractedText = extracted_text || '';
    }

    await supabase
      .from('contracts')
      .update({ extracted_text: finalExtractedText, status: 'ready' })
      .eq('id', recordId);

    console.log(`[${recordId}] Success.`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error(`[${recordId || 'SYSTEM'}] FATAL: ${err.message}`);
    
    if (recordId) {
      supabase.from('contracts')
        .update({ status: 'failed' })
        .eq('id', recordId)
        .then(() => {})
        .catch((e) => console.error("Secondary error:", e.message));
    }

    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500 
    });
  }
});
