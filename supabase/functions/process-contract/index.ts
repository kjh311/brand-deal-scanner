import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import PDFParse from "npm:pdf-parse"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { record } = await req.json()
    
    if (!record || !record.id || !record.source_type) {
      return new Response(JSON.stringify({ error: 'Invalid webhook payload: missing id or source_type' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { id, source_type, file_path, extracted_text } = record
    let finalExtractedText = ''

    // Initialize Supabase client with Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`Processing contract ${id} via source: ${source_type}`)

    if (source_type === 'file') {
      if (!file_path) {
        throw new Error('source_type "file" requires a file_path.')
      }

      // 1. Download file from storage
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('brand-contracts')
        .download(file_path)

      if (downloadError) {
        throw new Error(`Failed to download file: ${downloadError.message}`)
      }

      // 2. Extract text from PDF
      const arrayBuffer = await fileBlob.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)
      
      const pdfData = await PDFParse(buffer)
      finalExtractedText = pdfData.text
      console.log(`Successfully parsed PDF. Extracted ${finalExtractedText.length} characters.`)
    } 
    else if (source_type === 'text_input') {
      // 1. Simply use the text provided in the database insert
      finalExtractedText = extracted_text || ''
      console.log(`Using manually entered text (${finalExtractedText.length} characters).`)
    } 
    else {
      throw new Error(`Unsupported source_type: ${source_type}`)
    }

    // 3. Update the database record with the final text and status
    const { error: updateError } = await supabase
      .from('contracts')
      .update({ 
        extracted_text: finalExtractedText,
        status: 'ready' 
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(`Edge Function error: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
