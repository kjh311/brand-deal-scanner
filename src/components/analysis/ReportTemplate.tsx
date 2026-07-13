'use client'

import React from 'react'

interface ReportTemplateProps {
  contract: any
}

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(({ contract }, ref) => {
  const docName = (() => {
    const fileName = contract.file_path?.split('/').pop() || '';
    // If it has our UUID_ prefix, strip it (UUID is 36 chars)
    const displayName = fileName.includes('_') && fileName.indexOf('_') === 36
      ? fileName.substring(37)
      : fileName;
    return displayName.split('.')[0].replace(/_/g, ' ') || 'Contract';
  })();
  const reportId = `#BDS-${contract.id?.slice(0, 8).toUpperCase() || 'NEW'}`

  const redFlags = contract.predatory_clauses?.length || 0
  const mediumRisks = contract.cautionary_clauses?.length || 0
  const lowRisks = contract.legalese_translation?.length || 0

  // Standard Hex Colors to avoid html2canvas "lab" or "oklch" errors
  const colors = {
    primary: '#041627',
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate800: '#1e293b',
    rose50: '#fff1f2',
    rose500: '#f43f5e',
    rose600: '#e11d48',
    emerald50: '#ecfdf5',
    emerald600: '#059669',
    amber50: '#fffbeb',
    amber600: '#d97706',
  }

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      {/* We use a specific ID and target this element directly for html2pdf */}
      <article
        ref={ref}
        id="report-pdf-content"
        className="a4-canvas"
        style={{
          width: '210mm',
          minHeight: '297mm',
          background: colors.white,
          color: colors.slate800,
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

        {/* Header */}
        <header style={{ backgroundColor: colors.primary, color: colors.white, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.slate200}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: colors.white, fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.025em', textTransform: 'uppercase', margin: 0 }}>BRAND DEAL FIXER</h1>
          </div>
        </header>

        {/* Report Sub-Header */}
        <div style={{ width: '100%', textAlign: 'center', padding: '32px 0', backgroundColor: colors.slate50, borderBottom: `1px solid ${colors.slate200}` }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Confidential Audit Report</p>
          <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', margin: 0 }}>Contract Security Audit</h2>
          <p style={{ fontSize: '14px', color: colors.slate500, marginTop: '8px', fontWeight: 500 }}>Document: {docName}</p>
        </div>

        {/* Main Content Area */}
        <main style={{ padding: '32px', flexGrow: 1 }}>
          {/* Section 1: Executive Summary */}
          <section style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: '16px', padding: '24px', backgroundColor: colors.white }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', breakInside: 'avoid' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary, margin: 0 }}>Executive Summary</h3>
                <p style={{ fontSize: '12px', color: colors.slate500, margin: '4px 0 0 0' }}>Comprehensive risk analysis and fairness scoring.</p>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase' }}>Report ID: {reportId}</span>
                </div>
              </div>

               {/* Scorecard */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px', breakInside: 'avoid' }}>
                 <div style={{ padding: '16px', backgroundColor: colors.slate50, border: `1px solid ${colors.slate100}`, borderRadius: '12px', textAlign: 'center' }}>
                   <span style={{ fontSize: '9px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', display: 'block' }}>Health Score</span>
                   <span style={{ fontSize: '30px', fontWeight: 900, color: colors.emerald600 }}>{contract.health_score}<span style={{ fontSize: '14px', color: colors.slate400, fontWeight: 'bold' }}>/100</span></span>
                 </div>
                 <div style={{ padding: '16px', border: `1px solid ${colors.slate100}`, borderRadius: '12px', textAlign: 'center' }}>
                   <span style={{ fontSize: '9px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', display: 'block' }}>Red Flags</span>
                   <span style={{ fontSize: '24px', fontWeight: 'bold', color: colors.rose500 }}>{redFlags}</span>
                 </div>
                 <div style={{ padding: '16px', border: `1px solid ${colors.slate100}`, borderRadius: '12px', textAlign: 'center' }}>
                   <span style={{ fontSize: '9px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', display: 'block' }}>Caution Items</span>
                   <span style={{ fontSize: '24px', fontWeight: 'bold', color: colors.amber600 }}>{mediumRisks}</span>
                 </div>
                 <div style={{ padding: '16px', border: `1px solid ${colors.slate100}`, borderRadius: '12px', textAlign: 'center' }}>
                   <span style={{ fontSize: '9px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', display: 'block' }}>Safe Clauses</span>
                   <span style={{ fontSize: '24px', fontWeight: 'bold', color: colors.emerald600 }}>{lowRisks}</span>
                 </div>
               </div>

               {/* Financial Risk Quantifier */}
               {contract.financial_risk_quantifier && contract.financial_risk_quantifier.length > 0 && (
                 <div style={{ marginBottom: '24px', breakInside: 'avoid' }}>
                   <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: colors.primary, textTransform: 'uppercase', marginBottom: '12px', textAlign: 'center' }}>Estimated Liability Value Saved</h4>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                     {contract.financial_risk_quantifier.map((item: any, i: number) => (
                       <div key={i} style={{ padding: '12px', backgroundColor: colors.slate50, border: `1px solid ${colors.slate100}`, borderRadius: '8px' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                           <span style={{ fontSize: '8px', fontWeight: 'bold', color: colors.slate500, textTransform: 'uppercase' }}>{item.category}</span>
                           <span style={{ fontSize: '14px', fontWeight: 'bold', color: colors.emerald600 }}>${item.estimated_value?.toLocaleString() || '0'}</span>
                         </div>
                         <p style={{ fontSize: '10px', color: colors.slate600, lineHeight: 1.4 }}>{item.description}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

              {/* Summary Text */}
              <div style={{ backgroundColor: colors.slate50, borderRadius: '12px', padding: '16px', border: `1px solid ${colors.slate100}`, textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: colors.slate600, lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{contract.summary}"</p>
              </div>
            </div>
          </section>

          {/* Section 2: Risk Profile Analysis */}
          <section style={{ marginBottom: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ marginRight: '8px' }}>01.</span> Critical Risks
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {contract.predatory_clauses?.map((clause: any, i: number) => (
                <div key={i} style={{ borderLeft: `10px solid ${colors.rose500}`, border: `1px solid ${colors.slate200}`, borderLeftWidth: '10px', borderRadius: '12px', padding: '24px', backgroundColor: colors.white, breakInside: 'avoid', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: colors.rose600, textTransform: 'uppercase', margin: 0 }}>Risk {i + 1}: Critical Finding</h4>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: colors.rose600, backgroundColor: colors.rose50, padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase' }}>High Priority</span>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', marginBottom: '8px' }}>Passage:</p>
                    <blockquote style={{ fontSize: '11px', color: colors.slate600, border: `1px dashed ${colors.slate200}`, padding: '12px', borderRadius: '8px', margin: 0, fontStyle: 'italic', backgroundColor: colors.slate50 }}>
                      "{clause.snippet}"
                    </blockquote>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 'bold', color: colors.emerald600, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px', fontVariationSettings: "'FILL' 1" }}>analytics</span>
                      AI Analysis:
                    </p>
                    <p style={{ fontSize: '13px', color: colors.slate800, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                      {clause.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Cautionary Risks */}
          {contract.cautionary_clauses?.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ marginRight: '8px' }}>02.</span> Cautionary Risks
              </h3>
              <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: colors.slate50 }}>
                    <tr>
                      <th style={{ padding: '16px', fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', borderBottom: `1px solid ${colors.slate200}` }}>Category</th>
                      <th style={{ padding: '16px', fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', borderBottom: `1px solid ${colors.slate200}` }}>Status</th>
                      <th style={{ padding: '16px', fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', borderBottom: `1px solid ${colors.slate200}` }}>Impact Analysis</th>
                    </tr>
                  </thead>
                  <tbody style={{ verticalAlign: 'top' }}>
                    {contract.cautionary_clauses?.map((clause: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${colors.slate100}`, breakInside: 'avoid' }}>
                        <td style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: colors.slate800 }}>Cautionary Provision</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: colors.amber600, backgroundColor: colors.amber50, padding: '4px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>Warning</span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '12px', color: colors.slate600 }}>{clause.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 4: Missing Safeguards */}
          {contract.missing_protections?.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ marginRight: '8px' }}>03.</span> Missing Safeguards
              </h3>
              <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: colors.slate50 }}>
                    <tr>
                      <th style={{ padding: '16px', fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', borderBottom: `1px solid ${colors.slate200}` }}>Required Protection</th>
                      <th style={{ padding: '16px', fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', borderBottom: `1px solid ${colors.slate200}` }}>Status</th>
                      <th style={{ padding: '16px', fontSize: '10px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', borderBottom: `1px solid ${colors.slate200}` }}>Why It Matters</th>
                    </tr>
                  </thead>
                  <tbody style={{ verticalAlign: 'top' }}>
                    {contract.missing_protections?.map((item: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${colors.slate100}`, breakInside: 'avoid' }}>
                        <td style={{ padding: '16px', fontSize: '12px', fontWeight: 'bold', color: colors.slate800 }}>{item.protection}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: colors.rose600, backgroundColor: colors.rose50, padding: '4px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>Missing</span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '12px', color: colors.slate600 }}>{item.importance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 5: Legalese Translator */}
          {contract.legalese_translation?.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ marginRight: '8px' }}>04.</span> Legalese Translator
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {contract.legalese_translation?.map((item: any, i: number) => (
                  <div key={i} style={{ border: `1px solid ${colors.slate200}`, borderRadius: '12px', padding: '16px', backgroundColor: colors.slate50, breakInside: 'avoid' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '9px', fontWeight: 'bold', color: colors.slate400, textTransform: 'uppercase', marginBottom: '8px' }}>Original Text</p>
                        <p style={{ fontSize: '11px', color: colors.slate500, fontStyle: 'italic', margin: 0 }}>"{item.original}"</p>
                      </div>
                      <div style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: colors.emerald600 }}>arrow_forward</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '9px', fontWeight: 'bold', color: colors.emerald600, textTransform: 'uppercase', marginBottom: '8px' }}>Plain English</p>
                        <p style={{ fontSize: '12px', color: colors.slate800, fontWeight: 600, margin: 0 }}>{item.translation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Section 4: Suggested Response Draft */}
          {contract.suggested_response && (
            <section style={{ breakInside: 'avoid', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: colors.slate400, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ marginRight: '8px' }}>05.</span> Suggested Response Draft
              </h3>
               <div style={{ border: `1px solid ${colors.slate200}`, borderRadius: '16px', padding: '32px', backgroundColor: colors.slate50, textAlign: 'center' }}>
                 <div style={{ fontSize: '12px', color: colors.slate800, lineHeight: 1.8, fontStyle: 'normal', margin: 0, fontWeight: 500, whiteSpace: 'pre-line' }}>
                   {contract.suggested_response}
                 </div>
               </div>
             </section>
          )}
        </main>

        <footer style={{ marginTop: 'auto', backgroundColor: colors.primary, borderTop: `1px solid ${colors.slate200}`, padding: '40px 32px', textAlign: 'center', color: colors.white, breakInside: 'avoid' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: colors.white, opacity: 0.6, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Generated by Brand Deal Fixer</p>
          <p style={{ fontSize: '9px', color: colors.white, padding: '0 40px', lineHeight: 1.6, opacity: 0.5, margin: 0 }}>
            LEGAL DISCLAIMER: Brand Deal Fixer is an AI analysis tool and does not provide legal advice. This report is for informational purposes only. Consult a licensed attorney for official legal counsel.
          </p>
        </footer>
      </article>
    </div>
  )
})

ReportTemplate.displayName = 'ReportTemplate'

