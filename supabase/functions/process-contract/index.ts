import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { extractText, getDocumentProxy } from "npm:unpdf@latest"
import { Uint8ArrayReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.34/index.js"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * AI ANALYZER: PRIORITIZED ENGINE
 */
async function analyzeContract(contractText: string, customPrompt?: string) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  const vertexProjId = Deno.env.get('GOOGLE_PROJECT_ID');

  const defaultPrompt = `Act as a senior talent analyst. Analyze the provided contract and respond ONLY with a single valid JSON object.
    SCHEMA: { 
      "summary": "string", 
      "legalese_translation": [{"original": "string", "translation": "string"}], 
      "predatory_clauses": [{"snippet": "string", "explanation": "string"}], 
      "cautionary_clauses": [{"snippet": "string", "explanation": "string"}], 
      "missing_protections": [{"protection": "string", "importance": "string"}], 
      "suggested_response": "string (Start with 'Dear [Brand Name],' followed by two empty lines. End with two empty lines then 'Best, [User Name]' on one line)" 
    }
    CONTENT: ${contractText.substring(0, 30000)}`;

  const prompt = customPrompt || defaultPrompt;

  // --- ENGINE 1: GOOGLE AI STUDIO (PRIORITY) ---
  if (geminiApiKey) {
    console.log("[AI] Priority Engine: Google AI Studio");
    const studioUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`;

    const response = await fetch(studioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });

    if (!response.ok) throw new Error(`AI Studio Error: ${await response.text()}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("AI Studio returned empty response");
    return JSON.parse(text);
  }

  // --- ENGINE 2: VERTEX AI (FALLBACK) ---
  if (vertexProjId) {
    const clientEmail = Deno.env.get('GOOGLE_CLIENT_EMAIL') || '';
    const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n') || '';
    const token = await getVertexAccessToken(clientEmail, privateKey);
    const region = "us-central1";
    const vUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${vertexProjId}/locations/${region}/publishers/google/models/gemini-3.1-flash-lite:streamGenerateContent`;

    const vRes = await fetch(vUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
    });
    if (vRes.ok) {
      const vData = await vRes.json();
      return JSON.parse(vData[0]?.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  }

  throw new Error("No AI Engines configured.");
}

async function getVertexAccessToken(email: string, key: string) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = { iss: email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", exp: now + 3600, iat: now };
  const signInput = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(claim))}`;
  const binaryKey = Uint8Array.from(atob(key.replace(/-----BEGIN [A-Z ]+-----/g, "").replace(/-----END [A-Z ]+-----/g, "").replace(/\s/g, "")), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey("pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(signInput));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${signInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}` })
  });
  const data = await res.json();
  return data.access_token;
}

async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  const reader = new Uint8ArrayReader(uint8Array);
  const zipReader = new ZipReader(reader);
  try {
    const entries = await zipReader.getEntries();
    const docEntry = entries.find(e => e.filename === "word/document.xml");
    if (!docEntry) throw new Error("Invalid DOCX");
    // @ts-ignore
    const xml = await docEntry.getData(new TextWriter());
    return xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g)?.map(m => m.replace(/<[^>]+>/g, '')).join(' ') || "";
  } finally { await zipReader.close(); }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = createClient(supabaseUrl, supabaseKey);
  let recordId: string | null = null;

  try {
    const body = await req.json();
    recordId = body.contract_id || body.record?.id;
    if (!recordId) throw new Error("No ID");

    // Fetch the contract record
    const { data: record } = await supabase.from('contracts').select('*').eq('id', recordId).single();
    if (!record) throw new Error("Record not found");

    // 1. Fetch User Identity for personalized sign-off
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', record.user_id).single();

    // Try multiple common name fields in case of variations
    const userName = profile?.full_name || profile?.name || profile?.display_name || '[YOUR NAME]';
    console.log(`[AUDIT] Resolved User Identity (Prioritizing Name over Email): ${userName}`);

    const { source_type, file_path, extracted_text: existingText } = record;
    let text = existingText || '';

    if (source_type === 'file' && !text) {
      const { data: blob } = await supabase.storage.from('brand-contracts').download(file_path);
      if (!blob) throw new Error("File download failed");
      const buffer = await blob.arrayBuffer();
      const ext = file_path.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        text = (await extractText(pdf, { mergePages: true })).text;
      } else if (ext === 'docx') {
        text = await extractTextFromDocx(buffer);
      } else {
        text = new TextDecoder().decode(buffer);
      }
    }

    await supabase.from('contracts').update({ extracted_text: text, status: 'analyzing' }).eq('id', recordId);

    // 2. Auditor Prompt: Compensation Audit & Forced Comprehensiveness
    const customPrompt = `Act as a Senior Legal AI Architect & Auditor. Scan for deviations from creator industry standards. 
      PRUNING LOGIC: Ignore standard/fair clauses. Only report risks or unfavorable deviations.
      
      STRICT CATEGORIZATION:
      - predatory_clauses: ONLY include unfavorable/harmful clauses found in the text.
      - missing_protections: ONLY include items that ARE NOT in the text but should be.
      - legalese_translation: Identify the 3-5 most complex/complex legal clauses and provide plain-English summaries.
      
      COMPENSATION AUDIT:
      - Analyze compensation against professional market rates.
      - In 'summary', state if pay is 'Fair', 'Below Market', or 'Exposure-based'.
      - If product-only or vague, include: "Terms should be compared against your established rate card."

      RISK CHECKLIST:
      - Financial: Unlimited Indemnification, Unclear Payment Triggers, Net-90+ Terms, Unpaid Product/Shipping, No Kill Fees.
      - Rights/IP: Perpetual/Worldwide/Irrevocable, Work-for-Hire, Editing without approval, Loss of Portfolio Rights.
      - Exclusivity/Scope: Unlimited Revisions, Vague Competitors, Broad Non-Compete, Vague SOW, Right of First Refusal.
      - Termination: Unilateral Rights, Morals Clauses, No Termination for Cause.

      MISSING PROTECTIONS CHECKLIST (Flag if absent):
      1. Kill Fee, 2. Payment Timeline (Net-x), 3. Content Approval, 4. Usage Expiration, 5. Reimbursement, 6. Force Majeure, 7. Limited Indemnity, 8. Exclusivity Scope, 9. Portfolio Rights, 10. Dispute Resolution.

      INSTRUCTIONS:
      - 'suggested_response' MUST iterate through EVERY identified risk (predatory/cautionary) and EVERY missing protection. Do not omit or summarize the list.
      - Address each item individually in a dedicated sentence or paragraph.
      - Tone: Professional and firm. Start: "Dear [Brand Name]," + 3 newlines. End: 3 newlines + "Best, ${userName}".

      SCHEMA: { 
        "summary": "string", 
        "health_score": number (0-100),
        "brand_name": "string",
        "legalese_translation": [{"original": "string", "translation": "string"}], 
        "predatory_clauses": [{"snippet": "string", "explanation": "string"}], 
        "cautionary_clauses": [{"snippet": "string", "explanation": "string"}], 
        "missing_protections": [{"protection": "string", "importance": "string"}], 
        "suggested_response": "string" 
      }
      CONTENT: ${text.substring(0, 30000)}`;

    const analysis = await analyzeContract(text, customPrompt);

    await supabase.from('contracts').update({
      status: 'completed',
      health_score: analysis.health_score,
      summary: analysis.summary,
      legalese_translation: analysis.legalese_translation,
      predatory_clauses: analysis.predatory_clauses,
      cautionary_clauses: analysis.cautionary_clauses,
      missing_protections: analysis.missing_protections,
      suggested_response: analysis.suggested_response
    }).eq('id', recordId);

    // 3. Privacy Cleanup: Remove source file and clear extracted text
    if (source_type === 'file' && file_path) {
      console.log(`[PRIVACY] Deleting source file from storage: ${file_path}`);
      const { error: deleteError } = await supabase.storage.from('brand-contracts').remove([file_path]);
      if (deleteError) console.error(`[PRIVACY] Failed to delete file: ${deleteError.message}`);
    }

    console.log(`[PRIVACY] Clearing extracted text for record: ${recordId}`);
    await supabase.from('contracts').update({ extracted_text: null }).eq('id', recordId);

    // 4. Credit System: Subtract 1 credit from user profile
    console.log(`[CREDITS] Subtracting 1 credit from user: ${record.user_id}`);
    const { data: profileData } = await supabase.from('profiles').select('credits').eq('id', record.user_id).single();
    if (profileData) {
      const { error: updateError } = await supabase.from('profiles')
        .update({ credits: (profileData.credits || 0) - 1 })
        .eq('id', record.user_id);

      if (updateError) console.error(`[CREDITS] Failed to update credits: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error(`[CRITICAL] ${err.message}`);
    if (recordId) {
      try {
        await supabase.from('contracts').update({ status: 'failed' }).eq('id', recordId);
      } catch { /* Silent fail */ }
    }
    return new Response(JSON.stringify({ error: err.message }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 });
  }
});
