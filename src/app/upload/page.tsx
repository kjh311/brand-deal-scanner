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

  const resetAll = () => {
    setFile(null)
    setPastedText('')
    setAnalysisComplete(false)
    setIsAnalyzing(false)
    setCurrentContractId(null)
    resetWorkflow()
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
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-white/30 hover:border-white/50'}`}
              >
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                </div>

                <div className="text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); openFilePicker() }}
                    className="px-8 py-3 rounded-full bg-primary text-on-primary font-semibold active:scale-[0.985] transition-all cursor-pointer"
                  >
                    Add Document
                  </button>
                  <p className="mt-3 text-sm font-medium">DRAG &amp; DROP or CLICK TO UPLOAD</p>
                  <p className="text-xs text-on-surface-variant mt-1">PDF, DOCX, TXT, or IMAGE (JPG, PNG, WEBP)</p>
                </div>
              </div>

              {file && (
                <div className="glass-panel border border-white/30 rounded-xl px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">insert_drive_file</span>
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <button onClick={removeFile} className="text-on-surface-variant hover:text-error text-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">close</span> Remove
                  </button>
                </div>
              )}

              {file && !analysisComplete && (
                <div className="flex justify-end animate-in fade-in slide-in-from-top-2 duration-500">
                  <button
                    onClick={handleRealAnalysis}
                    disabled={isAnalyzing}
                    className="px-8 py-3 rounded-full bg-primary text-on-primary font-semibold transition-all hover:shadow-lg active:scale-95 cursor-pointer shadow-primary/20"
                  >
                    {isAnalyzing ? 'Processing & Analyzing...' : 'Scan Contract for Risks'}
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                onChange={onFileChange}
              />

              <div className="glass-panel border border-white/30 rounded-2xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Or paste contract text</h3>
                </div>

                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste the full contract text here..."
                  className="w-full h-44 resize-y bg-black/30 border border-white/20 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-primary/60"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleRealAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/20 hover:bg-white/5 active:bg-white/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">analytics</span>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Pasted Text'}
                  </button>
                </div>
              </div>


            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel border border-white/30 rounded-2xl p-7 shadow-2xl">
                <h3 className="font-semibold mb-6 text-lg border-b border-white/10 pb-4 flex items-center justify-between">
                  Audit Workflow
                  {analysisComplete && <span className="material-symbols-outlined text-emerald-400">check_circle</span>}
                </h3>

                <div className="space-y-6 relative">
                  <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-white/10" />

                  {workflow.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold transition-all duration-500
                        ${step.status === 'complete' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 
                          step.status === 'active' ? 'bg-primary/20 text-primary ring-2 ring-primary/50' : 
                                                     'bg-white/5 border border-white/10 text-on-surface-variant'}`}>
                        {step.number}
                      </div>
                      <div className="pt-0.5 flex-1">
                        <div className={`font-medium ${step.status === 'locked' ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                          {step.label}
                        </div>
                        {step.status === 'complete' && <div className="text-xs text-primary font-medium">Done</div>}
                        {step.status === 'active' && (
                          <div className="text-xs text-primary/80">
                            {step.number === 1 && (isUploading ? 'Uploading file...' : 'Waiting for upload...')}
                            {step.number === 2 && currentContractId && (
                              <ContractMonitor 
                                contractId={currentContractId} 
                                initialStatus="analyzing"
                                onComplete={handleAnalysisComplete}
                              />
                            )}
                            {step.number === 2 && !currentContractId && 'Preparing...'}
                          </div>
                        )}
                        {step.status === 'locked' && <div className="text-xs text-on-surface-variant/50">Pending</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {analysisComplete && (
                <div className="animate-in slide-in-from-bottom-5 duration-700">
                   <Link
                      href={`/analysis?id=${currentContractId}`} 
                      className="flex items-center justify-center w-full px-8 py-4 space-x-2 font-bold text-white transition-all rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl hover:shadow-emerald-500/20 active:scale-95"
                    >
                      <span>View Detailed Report</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                </div>
              )}

              <div className="glass-panel border border-white/30 rounded-2xl p-6 flex gap-4 items-start opacity-60">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary">verified_user</span>
                </div>
                <div>
                  <div className="font-semibold text-sm text-white">Privacy First</div>
                  <div className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                    Your contracts are analyzed in a secure sandbox.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer showCTA={false} />
    </>
  )
}
