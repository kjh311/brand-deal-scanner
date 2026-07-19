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

  const defaultPrompt = `Act as an elite professional talent manager negotiating a brand deal on behalf of a top-tier creator. Your goal is to protect the creator's interests while maintaining a collaborative, deal-closing relationship with the brand. NEVER sound defensive, litigious, or adversarial. Frame all requests as "standard industry adjustments to ensure a mutually beneficial partnership."

    EMAIL GENERATION RULES (MANDATORY):
    1. SUBJECT LINE: Professional, concise, and deal-oriented. Example: "Re: [Brand Name] Partnership — Excited to Collaborate!"
    2. OPENING: Start with genuine enthusiasm for the brand and the campaign. Mention something specific about the brand or product to show authentic interest.
    3. FORMAT: Use a clean, numbered list (1., 2., 3.) for all requested changes. Each item must reference the specific contract section number when available (e.g., "Section 5 (Exclusivity):...").
    4. TONE PER ITEM: Explain the "why" from a business standpoint. Use phrases like "To ensure we can both get the most out of this partnership..." or "This is a standard industry practice that helps creators deliver their best work..." instead of "This is unacceptable" or "We demand..."
    5. CRITICAL RISKS TO ALWAYS FLAG (if present in the contract):
       - EXCLUSIVITY OVERREACH: If exclusivity period exceeds 30 days or categories are overly broad (e.g., "casual wear" for a fitness deal), request reducing to 30 days and narrowing to direct competitors only.
       - PERPETUAL IP USAGE: If contract grants "perpetual" or "worldwide" rights, request swapping for a standard 6-to-12 month paid usage window with a renewal option.
       - CLAWBACKS/PERFORMANCE CLAUSES: If fees are tied to views, impressions, or engagement metrics, request flat-rate assurance to protect against algorithm volatility.
       - CANCELLATION RULES: If termination without cause is allowed, request a standard 50% "Kill Fee" for uncompleted deliverables.
    6. VALUE-DRIVEN: For every risk found, explain how the change benefits BOTH parties (e.g., "Flat rates ensure the creator can focus on production quality without algorithm pressure, which means better content for the brand").
    7. CLOSING: End with a proactive call-to-action to sign and get to work. Express eagerness to begin the partnership.
    8. SIGNATURE: End with "Best, [User Name]" on the final line.

    SCHEMA: { 
      "summary": "string", 
      "health_score": number (0-100),
      "brand_name": "string",
      "legalese_translation": [{"original": "string", "translation": "string"}], 
      "predatory_clauses": [{"snippet": "string", "explanation": "string"}], 
      "cautionary_clauses": [{"snippet": "string", "explanation": "string"}], 
      "missing_protections": [{"protection": "string", "importance": "string"}], 
      "suggested_response": "string (Full email template with Subject Line, greeting, numbered list of changes, and closing)" 
    }
    OUTPUT FORMATTING (MANDATORY):
    - The entire response MUST be a single valid JSON object only. Do NOT wrap it in markdown code fences (no \`\`\`).
    - The "suggested_response" value MUST be plain text with real newline characters separating lines. Do NOT use markdown (no **, #, >, or code fences) inside the email. Use actual line breaks, not the literal characters backslash-n.
    CONTENT: ${contractText.substring(0, 30000)}`;

  const prompt = customPrompt || defaultPrompt;

  // Helper to safely extract JSON from potentially messy AI responses
  const cleanAndParse = (text: string) => {
    try {
      // 1. Strip markdown code fences if the model wrapped the JSON in them
      let working = text.trim();
      const fenceMatch = working.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
      if (fenceMatch) working = fenceMatch[1].trim();

      // 2. Try a strict parse first (most reliable when responseMimeType is JSON)
      try {
        const strict = JSON.parse(working);
        return normalizeAnalysis(strict);
      } catch { /* fall through to slice-based recovery */ }

      // 3. Recover by slicing from the first '{' to the last '}'
      const start = working.indexOf('{');
      const end = working.lastIndexOf('}');
      if (start === -1 || end === -1) throw new Error("No JSON object found");

      const jsonStr = working.substring(start, end + 1);
      return normalizeAnalysis(JSON.parse(jsonStr));
    } catch (err) {
      console.error("[AI] JSON Parse Failed. Raw Text Segment:", text.substring(0, 100));
      throw new Error(`JSON Cleanup Error: ${err.message}`);
    }
  };

  // Normalize the parsed analysis so downstream rendering is consistent:
  // ensure the suggested_response is a clean plain-text email with real newlines.
  const normalizeAnalysis = (analysis: any) => {
    if (analysis && typeof analysis.suggested_response === 'string') {
      analysis.suggested_response = cleanEmail(analysis.suggested_response);
    }
    return analysis;
  };

  // Strip stray markdown fences and collapse escaped newline sequences into
  // real newlines so the email renders with proper line breaks everywhere.
  const cleanEmail = (email: string) => {
    let text = email.trim();
    // Remove wrapping code fences (``` or ~~~)
    text = text.replace(/^```(?:json|markdown|md|text)?\s*\n?/i, '').replace(/\n?```$/i, '');
    // Convert escaped newline sequences (\n) into real newlines
    text = text.replace(/\\n/g, '\n');
    // Strip any leftover inline markdown markers for a clean plain-text email
    text = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/^#{1,6}\s+/gm, '');
    return text.trim();
  };

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
    return cleanAndParse(text);
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
      const text = vData[0]?.candidates?.[0]?.content?.parts?.[0]?.text;
      return cleanAndParse(text);
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
    const customPrompt = `Act as an elite professional talent manager negotiating a brand deal on behalf of a top-tier creator. Your goal is to protect the creator's interests while maintaining a collaborative, deal-closing relationship with the brand. NEVER sound defensive, litigious, or adversarial. Frame all requests as "standard industry adjustments to ensure a mutually beneficial partnership."

    ZERO-MISSING-CLAUSES AUDIT PROTOCOL (MANDATORY):
    Before generating the response, scan the contract text for these 17 high-risk targets. If ANY are found, they MUST each receive its own distinct numbered bullet point in the email. Never combine separate risks into a single paragraph.
    
    1. HIDDEN LIQUIDATED DAMAGES & FINES: Scan for fixed monetary penalties (e.g., "$5,000 per incident"), flat fees for arbitrary breaches, or automatic billing penalties.
    2. EXCLUSIVITY OVERREACH: Scan for post-campaign windows exceeding 30 days, or categories that cross over into non-competing spaces.
    3. PERPETUAL IP / RIGHT-OF-PUBLICITY TRAPS: Scan for "perpetual," "irrevocable," "transferable," or "sublicensable" licenses that allow the brand to own the creator's likeness or content forever without ongoing royalties.
    4. PERFORMANCE CLAWBACKS / METRIC-BASED PAY: Scan for pay reductions or withheld installments tied to views, engagement, clicks, or impressions.
    5. ONE-SIDED INDEMNIFICATION: Scan for clauses forcing the creator to indemnify the brand without a matching clause forcing the brand to indemnify the creator for brand-provided assets/trademarks.
    6. MISSING KILL FEE: Check the Termination section. If the brand can cancel "without cause" and does not explicitly guarantee a minimum 50% payment for work-in-progress, flag it as a missing protection.
    7. UNREASONABLE TURNAROUND DEADLINES: Scan for tight turnarounds (under 48 business hours) for revisions or content edits that penalize the creator for delays.
    8. COMMUNICATION & OPERATIONAL BOUNDARIES: Scan for clauses that demand 24/7 availability, immediate responses, or off-hours contact. Require a provision limiting campaign communication to standard business hours.
    9. PERSONALITY & IP TRADEMARK OVERREACH: If a brand claims rights to a creator's "jokes, catchphrases, nicknames, or personal traits," explicitly demand those be stricken to protect the creator's core personal brand identity.
    10. VAGUE PAYMENT MILESTONES: Check the Payment section. If a flat fee is listed without a clear payout timeline (e.g., "50% upfront / 50% upon completion"), explicitly propose a standard net-30 or split milestone structure.
    11. PERSONAL LIFE OVERREACH: Scan for clauses that dictate a creator's behavior outside of commercial social media platforms, such as mandates regarding private life, family gatherings, personal relationships, or offline personal conduct that doesn't affect public reputation. Demand these clauses be stricken entirely to protect the creator's personal boundaries.
    12. AUTOMATIC RENEWAL/OPT-OUT TRAPS: Scan the Term section. If an agreement automatically renews and requires an opt-out window that forces the creator to decide before the campaign deliverables are even completed, flag it and demand the auto-renewal be completely removed.
    13. RETROACTIVE/HISTORICAL CONTENT GRABS: Scan the IP section for any clauses claiming rights to content created prior to the contract's effective date. Explicitly demand that historical content be excluded from the scope of the license.
    14. DASHBOARD & PRIVATE PLATFORM ACCESS: Scan for clauses demanding direct access, passwords, or read-only access to a creator's backend analytics dashboards or email lists. Require that metrics be delivered via screenshot/PDF report instead of direct platform access.
    15. STRICT IP TIME LIMITS: Enforce a zero-tolerance policy on the word "perpetual" in the generated 'Proposed Language' for IP clauses. It must ALWAYS explicitly insert a capped timeline (e.g., "12 months") unless the user overrides it.
    16. POST-CAMPAIGN COMPETITIVE RIGHT OF FIRST REFUSAL: Scan for provisions that force a creator to disclose competitor offers or give the brand matching rights after the contract has ended. Explicitly demand that these handcuffs be stripped to protect the creator's future commercial mobility.
    16. ZERO-TOLERANCE "WE" FILTER: Perform a final text sweep on the intro and outro paragraphs to ensure collective pronouns ("we", "our", "us") are completely replaced with first-person singular phrasing ("I", "my", "me") or passive business terms.

    EMAIL GENERATION RULES (MANDATORY):
    1. PRONOUN: STRICTLY FIRST-PERSON SINGULAR. Use only "I", "me", and "my" throughout. NEVER use collective pronouns like "we", "our", or "us" when proposing changes. The tone must always reflect a solo entrepreneur speaking for themselves. Examples: "I request narrowing" NOT "we should narrow"; "I am thrilled" NOT "we are excited".
    2. SUBJECT LINE: Professional, concise, and deal-oriented. Example: "Re: [Brand Name] Partnership — Excited to Collaborate!"
    3. OPENING: Start with genuine enthusiasm for the brand and the campaign. Mention something specific about the brand or product to show authentic interest. Use first-person singular voice.
    4. FORMAT: Use a clean, numbered list (1., 2., 3.) for all requested changes. Each item must follow this exact 3-part structure:
       a. Reference the Section: State the specific section name/number found in the contract.
       b. State the Business "Why": Explain the adjustment using creator-industry logic (protecting income, algorithm unpredictability, standard asset valuation).
       c. Offer the Fair Alternative: Propose a specific, balanced compromise based on what was found.
       d. PROPOSED LANGUAGE: At the very end of each numbered bullet, conclude with this exact format on its own line:
          "-> Proposed Language: [Insert exact, professionally drafted legal sentence here]"
     5. HIGH-END TONE: Firm, professional, collaborative, and structured directly by contract section numbers. Use first-person singular phrases like "To ensure I can deliver the best results for this partnership..." instead of "This is unacceptable." NEVER use collective pronouns like "we" or "our" in the intro, outro, or bullet points.
    6. VALUE-DRIVEN: For every risk found, explain how the change benefits BOTH parties.
    7. CLOSING: End with a proactive, collaborative call-to-action to sign and get to work. Express eagerness to begin the partnership in first-person.
    8. SIGNATURE: End with "Best, ${userName}" on the final line.

    ANALYSIS INSTRUCTIONS:
    - PRUNING LOGIC: Ignore standard/fair clauses. Only report risks or unfavorable deviations.
    - STRICT CATEGORIZATION:
      - predatory_clauses: ONLY include unfavorable/harmful clauses found in the text.
      - missing_protections: ONLY include items that ARE NOT in the text but should be.
      - legalese_translation: Identify the 3-5 most complex legal clauses and provide plain-English summaries.
    - COMPENSATION AUDIT:
      - Analyze compensation against professional market rates.
      - In 'summary', state if pay is 'Fair', 'Below Market', or 'Exposure-based'.
      - If product-only or vague, include: "Terms should be compared against your established rate card."
    - RISK CHECKLIST:
      - Financial: Unlimited Indemnification, Unclear Payment Triggers, Net-90+ Terms, Unpaid Product/Shipping, No Kill Fees.
      - Rights/IP: Perpetual/Worldwide/Irrevocable, Work-for-Hire, Editing without approval, Loss of Portfolio Rights.
      - Exclusivity/Scope: Unlimited Revisions, Vague Competitors, Broad Non-Compete, Vague SOW, Right of First Refusal.
      - Termination: Unilateral Rights, Morals Clauses, No Termination for Cause.
    - MISSING PROTECTIONS CHECKLIST (Flag if any are missing/vague):
      1. Kill Fee (Early cancellation compensation).
      2. Payment Timeline (Hard net terms, e.g., Net-30).
      3. Content Approval Rights (Sign-off on brand edits).
      4. Usage Expiration (Specific end date for IP rights).
      5. Reimbursement Clause (Coverage for shipping/taxes/production).
      6. Force Majeure (Illness/travel acts of God protection).
      7. Limited Indemnity (Liability limited to own actions).
      8. Exclusivity Scope (Narrow competitor lists, not categories).
      9. Portfolio Rights (Right to showcase in media kit).
      10. Dispute Resolution (Local/affordable mediation process).
       * Also flag any other standard talent agreement protections that are absent.

    SCHEMA: { 
      "summary": "string", 
      "health_score": number (0-100),
      "brand_name": "string",
      "legalese_translation": [{"original": "string", "translation": "string"}], 
      "predatory_clauses": [{"snippet": "string", "explanation": "string"}], 
      "cautionary_clauses": [{"snippet": "string", "explanation": "string"}], 
      "missing_protections": [{"protection": "string", "importance": "string"}], 
      "suggested_response": "string (plain-text email with real newlines)" 
    }
    OUTPUT FORMATTING (MANDATORY):
    - The entire response MUST be a single valid JSON object only. Do NOT wrap it in markdown code fences (no \`\`\`).
    - The "suggested_response" value MUST be plain text with real newline characters separating lines. Do NOT use markdown (no **, #, >, or code fences) inside the email. Use actual line breaks, not the literal characters backslash-n.
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
