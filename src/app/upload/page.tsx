'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

interface WorkflowStep {
  number: number
  label: string
  status: 'complete' | 'active' | 'locked'
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([
    { number: 1, label: 'Upload Contract', status: 'active' },
    { number: 2, label: 'AI Analysis', status: 'locked' },
    { number: 3, label: 'Get Report', status: 'locked' },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetWorkflow = () => {
    setWorkflow([
      { number: 1, label: 'Upload Contract', status: 'active' },
      { number: 2, label: 'AI Analysis', status: 'locked' },
      { number: 3, label: 'Get Report', status: 'locked' },
    ])
  }

  const updateWorkflow = (step: number) => {
    setWorkflow(prev =>
      prev.map(s => {
        if (s.number < step) return { ...s, status: 'complete' }
        if (s.number === step) return { ...s, status: 'active' }
        return { ...s, status: 'locked' }
      })
    )
  }

  const handleFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png']
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload PDF, DOCX, TXT, JPG, or PNG files only.')
      return
    }
    setFile(selectedFile)
    setAnalysisComplete(false)
    resetWorkflow()
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) handleFile(selected)
    e.target.value = ''
  }

  const removeFile = () => {
    setFile(null)
    setAnalysisComplete(false)
    resetWorkflow()
  }

  const simulateAnalysis = async () => {
    if (!file && !pastedText.trim()) {
      alert('Please upload a file or paste contract text.')
      return
    }

    setIsAnalyzing(true)
    setAnalysisComplete(false)

    updateWorkflow(2)
    await new Promise(r => setTimeout(r, 1200))

    updateWorkflow(3)
    await new Promise(r => setTimeout(r, 2200))

    setIsAnalyzing(false)
    setAnalysisComplete(true)
  }

  const resetAll = () => {
    setFile(null)
    setPastedText('')
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    resetWorkflow()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Dashboard Nav */}
      <nav className="glass-nav sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16 px-10">
           <Link href="/" className="flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
             <span className="font-headline text-xl font-bold tracking-tight text-primary">Brand Deal Scanner</span>
           </Link>

            <div className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/upload" className="text-primary font-semibold border-b-2 border-primary pb-0.5">Upload</Link>
            <Link href="/audits" className="text-on-surface-variant hover:text-primary transition-colors font-medium">Audits</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/60 border border-white/10 text-sm">
              <span className="material-symbols-outlined text-primary text-lg">token</span>
              <span>3 Audits Remaining</span>
            </div>

            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center ring-1 ring-outline-variant group-hover:ring-primary transition-all">
                <span className="material-symbols-outlined text-primary text-lg">person</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">expand_more</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-10 px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h1 className="font-headline text-3xl font-semibold tracking-tight">Contract Analysis &amp; Risk Detection</h1>
                <p className="text-on-surface-variant mt-2 text-[15px]">
                  Upload your influencer or talent agreement to scan for hidden traps and unfavorable clauses.
                </p>
              </div>

              <div
                onClick={openFilePicker}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`glass-panel rounded-2xl p-10 flex flex-col items-center justify-center gap-6 border-2 border-dashed transition-all cursor-pointer
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-white/15 hover:border-white/30'}`}
              >
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                </div>

                <div className="text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); openFilePicker() }}
                    className="px-8 py-3 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.985] transition-all"
                  >
                    Add Document
                  </button>
                  <p className="mt-3 text-sm font-medium">DRAG &amp; DROP or CLICK TO UPLOAD</p>
                  <p className="text-xs text-on-surface-variant mt-1">PDF, DOCX, JPG, PNG, or TXT</p>
                </div>

                <div className="flex gap-6 text-center text-xs text-on-surface-variant">
                  {['PDF', 'DOCX', 'IMG', 'TXT'].map((t, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-xl">description</span>
                      <span className="font-mono tracking-[0.5px]">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {file && (
                <div className="glass-panel rounded-xl px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">insert_drive_file</span>
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}</div>
                    </div>
                  </div>
                  <button onClick={removeFile} className="text-on-surface-variant hover:text-error text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">close</span> Remove
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                onChange={onFileChange}
              />

              <div className="glass-panel rounded-2xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Or paste contract text</h3>
                  <span className="text-[10px] font-mono tracking-[1px] text-on-surface-variant">PASTE &amp; ANALYZE</span>
                </div>

                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the full contract text here..."
                  className="w-full h-44 resize-y bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-primary/60 placeholder:text-on-surface-variant/60"
                />

                <div className="flex justify-end">
                  <button
                    onClick={simulateAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 active:bg-white/10 disabled:opacity-50 transition text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-lg">analytics</span>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Pasted Text'}
                  </button>
                </div>
              </div>

              {file && !analysisComplete && (
                <div className="flex justify-end">
                  <button
                    onClick={simulateAnalysis}
                    disabled={isAnalyzing}
                    className="px-8 py-3 rounded-full bg-primary text-on-primary font-semibold disabled:opacity-60 flex items-center gap-2"
                  >
                    {isAnalyzing ? 'Analyzing Contract...' : 'Scan Contract for Risks'}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel rounded-2xl p-7">
                <h3 className="font-semibold mb-6 text-lg border-b border-white/10 pb-4">Audit Workflow</h3>

                <div className="space-y-6 relative">
                  <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-white/10" />

                  {workflow.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold
                        ${step.status === 'complete' ? 'bg-primary text-on-primary' : 
                          step.status === 'active' ? 'bg-primary/20 text-primary ring-1 ring-primary/50' : 
                          'bg-white/5 border border-white/10 text-on-surface-variant'}`}>
                        {step.number}
                      </div>
                      <div className="pt-0.5">
                        <div className={`font-medium ${step.status === 'locked' ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                          {step.label}
                        </div>
                        {step.status === 'complete' && <div className="text-xs text-primary">Complete</div>}
                        {step.status === 'active' && <div className="text-xs text-primary/80">In progress...</div>}
                        {step.status === 'locked' && <div className="text-xs text-on-surface-variant/50">Pending</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary">verified_user</span>
                </div>
                <div>
                  <div className="font-semibold text-sm">Bank-Level Security</div>
                  <div className="text-xs text-on-surface-variant mt-1 leading-snug">
                    Files are processed in-memory. Nothing is stored on our servers.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {analysisComplete && (
            <div className="mt-10 max-w-[1280px] mx-auto">
              <div className="glass-panel rounded-3xl p-8 md:p-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="uppercase tracking-[1.5px] text-xs text-on-surface-variant">Analysis Complete</div>
                    <h2 className="text-2xl font-semibold tracking-tight mt-1">Deal Health Score: <span className="text-primary">68/100</span></h2>
                  </div>
                  <button onClick={resetAll} className="text-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">refresh</span> Start New Scan
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-semibold mb-3 flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-tertiary">warning</span> Top Red Flags
                    </div>
                    <ul className="space-y-3 text-sm">
                      {[
                        'Morality clause allows immediate termination for "public controversy"',
                        'Unlimited usage rights across all platforms and territories in perpetuity',
                        'Payment tied to performance metrics with no minimum guarantee',
                        'Non-compete extends 24 months post-contract'
                      ].map((flag, i) => (
                        <li key={i} className="flex gap-3 text-on-surface-variant">
                          <span className="text-tertiary mt-0.5">•</span> {flag}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="font-semibold mb-3 text-sm">Plain English Summary</div>
                    <p className="text-on-surface-variant text-sm leading-relaxed">
                      This contract heavily favors the brand. You grant near-total rights to your content and likeness
                      while receiving limited compensation and protection. Several clauses expose you to significant legal and financial risk.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                  <button className="px-6 py-2.5 rounded-full bg-primary text-on-primary font-semibold text-sm">Generate Counter-Offer</button>
                  <button className="px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 text-sm">Download PDF Report</button>
                  <button className="px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 text-sm">Save to Audits</button>
                </div>

                <div className="text-[10px] text-on-surface-variant/60 pt-2">
                  This is not legal advice. Always consult a qualified attorney for contract review.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="glass-footer border-t border-white/10 py-4 text-xs text-on-surface-variant">
        <div className="max-w-[1280px] mx-auto px-10 flex flex-col md:flex-row gap-y-2 md:items-center md:justify-between">
          <div className="flex gap-x-5">
            <a href="#" className="hover:text-on-surface">How it Works</a>
            <a href="#" className="hover:text-on-surface">Privacy</a>
            <a href="#" className="hover:text-on-surface">Legal Disclaimer</a>
          </div>
          <div>© 2026 Brand Deal Scanner — Privacy-first contract intelligence</div>
        </div>
      </footer>
    </div>
  )
}
