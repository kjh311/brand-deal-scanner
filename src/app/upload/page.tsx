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
  subtext?: string
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
    { number: 1, label: 'Upload Contract', status: 'active', subtext: 'Awaiting Upload' },
    { number: 2, label: 'AI Analysis', status: 'locked', subtext: 'Pending...' },
    { number: 3, label: 'Get Report', status: 'locked', subtext: 'Locked' },
  ])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetWorkflow = () => {
    setWorkflow([
      { number: 1, label: 'Upload Contract', status: 'active', subtext: 'Awaiting Upload' },
      { number: 2, label: 'AI Analysis', status: 'locked', subtext: 'Pending...' },
      { number: 3, label: 'Get Report', status: 'locked', subtext: 'Locked' },
    ])
  }

  const updateWorkflow = (step: number) => {
    setWorkflow(prev =>
      prev.map(s => {
        if (s.number < step) return { ...s, status: 'complete', subtext: 'Finished' }
        if (s.number === step) return { ...s, status: 'active', subtext: 'In Progress...' }
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
    <div className="min-h-screen relative bg-black overflow-x-hidden text-slate-200">
      {/* CINEMATIC BACKGROUND IMAGE */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/background.png" 
          alt="background" 
          className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-40 scale-110"
        />
        {/* Radial Vignette to darken area behind cards */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 pt-32 pb-20 px-6 md:px-10 max-w-[850px] mx-auto">
        <div className="space-y-10">
          
          {/* MAIN UPLOAD CARD */}
          <section className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-[2.5rem] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-10">
            <div className="space-y-4 text-center">
              <h1 className="font-headline text-4xl font-bold tracking-tight text-white">Contract Analysis & Risk Detection</h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
                Upload your influencer or talent agreement to scan for hidden traps and unfavorable clauses.
              </p>
            </div>

            <div
              onClick={analysisComplete || isAnalyzing ? undefined : openFilePicker}
              onDrop={analysisComplete || isAnalyzing ? undefined : handleDrop}
              onDragOver={analysisComplete || isAnalyzing ? undefined : handleDragOver}
              onDragLeave={analysisComplete || isAnalyzing ? undefined : handleDragLeave}
              className={`flex flex-col items-center justify-center gap-8 border-2 border-dashed rounded-[2rem] min-h-[380px] transition-all relative overflow-hidden
                ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500'}
                ${analysisComplete || isAnalyzing ? 'cursor-default border-solid border-blue-500/10' : 'cursor-pointer'}`}
            >
              {!isAnalyzing && !analysisComplete ? (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center mx-auto shadow-xl border border-slate-700/50">
                    <span className="material-symbols-outlined text-slate-400 text-4xl">cloud_upload</span>
                  </div>
                  <div>
                    <button className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all cursor-pointer">
                      Add Document
                    </button>
                    <p className="mt-6 text-white font-black uppercase tracking-[2px] text-[10px]">DRAG & DROP OR CLICK TO UPLOAD</p>
                    <p className="text-slate-500 text-[11px] mt-2 font-medium uppercase tracking-widest">PDF, DOCX, JPG, PNG, or Text</p>
                  </div>
                  <div className="flex gap-6 justify-center pt-2 opacity-40">
                     <span className="material-symbols-outlined text-red-400 scale-75">picture_as_pdf</span>
                     <span className="material-symbols-outlined text-blue-400 scale-75">description</span>
                     <span className="material-symbols-outlined text-emerald-400 scale-75">image</span>
                     <span className="material-symbols-outlined text-slate-400 scale-75">subject</span>
                  </div>
                </div>
              ) : isAnalyzing && !analysisComplete ? (
                <div className="w-full max-w-sm space-y-8 p-10 animate-in fade-in duration-700">
                   {/* Audit Workflow embedded when analyzing */}
                   <div className="space-y-6">
                      <div className="text-center mb-8">
                         <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                         <p className="text-sm font-bold text-white uppercase tracking-widest">Audit in Transit</p>
                      </div>
                      <div className="space-y-6 relative">
                        <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-slate-800" />
                        {workflow.map((step, idx) => (
                           <div key={idx} className="flex gap-6 items-start relative z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-all duration-500
                                ${step.status === 'complete' ? 'bg-blue-600 text-white' : 
                                  step.status === 'active' ? 'bg-white text-slate-950 shadow-xl' : 
                                  'bg-slate-800 border border-slate-700 text-slate-600'}`}>
                                {step.status === 'complete' ? <span className="material-symbols-outlined text-sm">check</span> : step.number}
                              </div>
                              <div className="space-y-0.5">
                                 <p className={`text-xs font-bold ${step.status === 'locked' ? 'text-slate-600' : 'text-slate-200'}`}>{step.label}</p>
                                 <p className="text-[9px] font-black uppercase tracking-[1px] text-slate-500">
                                   STATUS: <span className={step.status === 'active' ? 'text-blue-500' : ''}>{step.subtext}</span>
                                 </p>
                                 {step.status === 'active' && step.number === 2 && currentContractId && (
                                   <div className="mt-2 scale-75 origin-left">
                                      <ContractMonitor 
                                        contractId={currentContractId} 
                                        initialStatus="analyzing"
                                        onComplete={handleAnalysisComplete}
                                      />
                                   </div>
                                 )}
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="text-center space-y-8 animate-in zoom-in fade-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto border border-emerald-500/20">
                    <span className="material-symbols-outlined text-emerald-500 text-4xl">verified</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Scanned & Secured</h3>
                    <p className="text-slate-400 text-sm">Your professional risk report is ready for review.</p>
                  </div>
                  <button
                    onClick={() => currentContractId && (window.location.href = `/analysis?id=${currentContractId}`)} 
                    className="inline-flex items-center justify-center px-10 py-4 space-x-3 font-black text-slate-950 transition-all rounded-xl bg-white hover:scale-105 active:scale-95 text-base shadow-2xl cursor-pointer"
                  >
                    <span>VIEW DETAILED REPORT</span>
                    <span className="material-symbols-outlined">analytics</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* PASTE SECTION / FILE PREVIEW */}
          {file && !isAnalyzing && !analysisComplete && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-blue-500/20">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                     <span className="material-symbols-outlined text-blue-500 text-2xl">insert_drive_file</span>
                  </div>
                  <div>
                     <p className="font-bold text-white leading-tight">{file.name}</p>
                     <p className="text-xs text-slate-500 font-mono tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB — READY</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={removeFile}
                    className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRealAnalysis}
                    className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-[2px] shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Scan Contract
                  </button>
               </div>
            </div>
          )}

          {!file && !isAnalyzing && !analysisComplete && (
            <section className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-[2.5rem] p-10 bg-white/[0.02] space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold text-white">Alternative: Copy-Paste Text</h3>
                 <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">MANUAL ENTRY</span>
               </div>
               <textarea
                 value={pastedText}
                 onChange={(e) => setPastedText(e.target.value)}
                 placeholder="Insert your contract text here for immediate AI processing..."
                 className="w-full h-44 bg-black/40 border border-slate-700/50 rounded-2xl p-8 font-mono text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-slate-600 resize-none"
               />
               <div className="flex justify-end">
                 <button
                   onClick={handleRealAnalysis}
                   className="flex items-center gap-3 px-8 py-4 rounded-xl border border-slate-700 hover:bg-white/5 active:scale-95 transition-all font-black text-white text-xs uppercase tracking-[2px] cursor-pointer"
                 >
                   <span className="material-symbols-outlined text-slate-400 text-lg">content_paste</span>
                   Paste Text & Analyze
                 </button>
               </div>
            </section>
          )}

          {/* Footer Metrics */}
          <div className="flex flex-wrap items-center justify-center gap-10 pt-4 opacity-30">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-emerald-500 text-sm">enhanced_encryption</span>
               <span className="text-[9px] font-black uppercase tracking-[3px]">Bank-Level Security</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-blue-500 text-sm">bolt</span>
               <span className="text-[9px] font-black uppercase tracking-[3px]">Real-time auditing</span>
             </div>
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-indigo-500 text-sm">token</span>
               <span className="text-[9px] font-black uppercase tracking-[3px]">1 Credit Per Scan</span>
             </div>
          </div>
        </div>
      </main>

      <Footer />
      
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />
    </div>
  )
}
