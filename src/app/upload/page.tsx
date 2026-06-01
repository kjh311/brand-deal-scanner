'use client'

import React, { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { uploadContract, registerManualContract } from '@/lib/actions/contracts'
import ContractMonitor from '@/components/features/ContractMonitor'

interface WorkflowStep {
  number: number
  label: string
  status: 'complete' | 'active' | 'locked'
}

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [currentContractId, setCurrentContractId] = useState<string | null>(null)
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
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain', 
      'image/jpeg', 
      'image/png', 
      'image/webp'
    ]
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

  const handleRealAnalysis = async () => {
    if (!file && !pastedText.trim()) {
      alert('Please upload a file or paste contract text.')
      return
    }

    setIsUploading(true)
    setIsAnalyzing(true)
    setAnalysisComplete(false)

    try {
      let contractRecord;
      if (file) {
        contractRecord = await uploadContract(file)
      } else if (pastedText.trim()) {
        contractRecord = await registerManualContract(pastedText.trim())
      }

      if (contractRecord?.id) {
        setCurrentContractId(contractRecord.id);
        updateWorkflow(2)
        setIsUploading(false)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Something went wrong during the upload process.')
      setIsUploading(false)
      setIsAnalyzing(false)
      resetWorkflow()
    }
  }

  const handleAnalysisComplete = () => {
    updateWorkflow(3);
    setIsAnalyzing(false);
    setAnalysisComplete(true);
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0a0a0f]/60" />
        <div className="absolute -top-1/4 -left-1/4 w-[750px] h-[750px] rounded-full bg-primary/50 blur-[150px]" />
        <div className="absolute top-1/4 -right-1/3 w-[600px] h-[600px] rounded-full bg-secondary/45 blur-[130px]" />
        <div className="absolute -bottom-1/3 left-1/5 w-[550px] h-[550px] rounded-full bg-tertiary/40 blur-[140px]" />
      </div>

      <Navbar />

      <main className="flex-1 py-10 px-6 md:px-10">
        <div className="max-w-[800px] mx-auto space-y-12">
          
          <div className="text-center space-y-4">
            <h1 className="font-headline text-4xl font-bold tracking-tight text-white">Contract Security Scan</h1>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
              Upload your agreement to identify predatory clauses and missing legal safeguards.
            </p>
          </div>

          <div
            onClick={analysisComplete || isAnalyzing ? undefined : openFilePicker}
            onDrop={analysisComplete || isAnalyzing ? undefined : handleDrop}
            onDragOver={analysisComplete || isAnalyzing ? undefined : handleDragOver}
            onDragLeave={analysisComplete || isAnalyzing ? undefined : handleDragLeave}
            className={`glass-panel rounded-[3rem] p-12 flex flex-col items-center justify-center gap-8 border-2 border-dashed transition-all min-h-[400px] relative overflow-hidden
              ${isDragging ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-white/40'}
              ${analysisComplete || isAnalyzing ? 'cursor-default border-solid border-blue-500/30' : 'cursor-pointer'}`}
          >
            {/* Background Glow */}
            {(isAnalyzing || analysisComplete) && (
               <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            )}

            {!isAnalyzing && !analysisComplete ? (
              <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-8 ring-primary/5">
                  <span className="material-symbols-outlined text-primary text-5xl">cloud_upload</span>
                </div>
                <div>
                  <button className="px-10 py-4 rounded-2xl bg-primary text-on-primary font-bold text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all">
                    Add Document
                  </button>
                  <p className="mt-6 text-slate-400 font-medium tracking-wide uppercase text-xs">Drag & Drop or Click to Upload</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[2px]">PDF, DOCX, TXT, or IMAGE</p>
                </div>
              </div>
            ) : isAnalyzing && !analysisComplete ? (
              <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">Audit in Progress</h3>
                  <p className="text-sm text-slate-400">Our AI Architect is scanning your contract for risks.</p>
                </div>

                <div className="space-y-6 relative">
                  <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-white/10" />
                  {workflow.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold transition-all duration-500
                        ${step.status === 'complete' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 
                          step.status === 'active' ? 'bg-primary/20 text-primary ring-2 ring-primary/50' : 
                                                     'bg-white/5 border border-white/10 text-on-surface-variant'}`}>
                        {step.status === 'complete' ? <span className="material-symbols-outlined text-sm">check</span> : step.number}
                      </div>
                      <div className="pt-0.5 flex-1">
                        <div className={`font-medium text-sm ${step.status === 'locked' ? 'text-slate-500' : 'text-slate-200'}`}>
                          {step.label}
                        </div>
                        {step.status === 'active' && (
                          <div className="text-xs text-primary/80 font-medium mt-1">
                            {step.number === 1 && (isUploading ? 'Securing document...' : 'Validating...')}
                            {step.number === 2 && currentContractId && (
                              <ContractMonitor 
                                contractId={currentContractId} 
                                initialStatus="analyzing"
                                onComplete={handleAnalysisComplete}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-8 animate-in zoom-in fade-in duration-1000 relative z-20">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                  <span className="material-symbols-outlined text-emerald-500 text-5xl">verified</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Analysis Complete</h3>
                  <p className="text-slate-400">Your professional risk report is ready.</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("[NAV] Navigating to report:", currentContractId);
                    if (currentContractId) {
                      window.location.href = `/analysis?id=${currentContractId}`;
                    } else {
                      console.error("[NAV] Missing Contract ID");
                    }
                  }} 
                  className="inline-flex items-center justify-center px-10 py-5 space-x-3 font-bold text-white transition-all rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95 text-lg cursor-pointer relative z-30"
                >
                  <span>View Detailed Report</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            )}
          </div>

          {file && !isAnalyzing && !analysisComplete && (
            <div className="glass-panel border border-white/20 rounded-[2rem] p-6 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">insert_drive_file</span>
                </div>
                <div>
                  <div className="font-bold text-white">{file.name}</div>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={removeFile} className="text-slate-500 hover:text-white transition text-xs font-bold uppercase tracking-widest px-4">
                  Cancel
                </button>
                <button
                  onClick={handleRealAnalysis}
                  className="px-8 py-3 rounded-xl bg-white text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-all"
                >
                  Scan Contract
                </button>
              </div>
            </div>
          )}

          {!isAnalyzing && !analysisComplete && (
             <div className="glass-panel border border-white/20 rounded-[3rem] p-10 space-y-6">
                <h3 className="font-bold text-xl text-white">Or paste contract text</h3>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste legal text here..."
                  className="w-full h-44 resize-none bg-black/40 border border-white/10 rounded-2xl p-6 font-mono text-sm text-slate-300 focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-600"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleRealAnalysis}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl border-2 border-white/10 hover:bg-white/5 active:scale-95 transition-all font-bold text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">analytics</span>
                    Analyze Text
                  </button>
                </div>
              </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 opacity-40">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-secondary">verified_user</span>
               <span className="text-[10px] font-black uppercase tracking-[3px]">Privacy Secured</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary">token</span>
               <span className="text-[10px] font-black uppercase tracking-[3px]">1 Credit / Scan</span>
             </div>
          </div>
        </div>
      </main>
      <Footer showCTA={false} />
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />
    </>
  )
}
