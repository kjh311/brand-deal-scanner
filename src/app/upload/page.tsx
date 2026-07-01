'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { uploadContract, registerManualContract } from '@/lib/actions/contracts'
import ContractMonitor from '@/components/features/ContractMonitor'
import { handleCheckout } from '@/lib/stripe-client'

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

  const [subStatus, setSubStatus] = useState<{ plan: string; credits: number; currentPeriodEnd: number | null; nextBillingDate: string | null } | null>(null)
  const [isLoadingSub, setIsLoadingSub] = useState(true)
  const [loadingTopUp, setLoadingTopUp] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(5)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const getTierQuotaCredits = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'agency':
        return 100;
      case 'professional':
        return 20;
      case 'plus':
        return 5;
      default:
        return 0;
    }
  }

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/subscription-status')
        if (res.ok) {
          const data = await res.json()
          setSubStatus(data)
        }
      } catch (err) {
        console.error('Error fetching subscription status:', err)
      } finally {
        setIsLoadingSub(false)
      }
    }
    fetchStatus()
  }, [])

  const getTopUpDetails = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'agency':
        return { productId: 'prod_UfT1DRTXQOzn94', pricePerUnit: 0.79, name: 'Agency Tier' };
      case 'professional':
        return { productId: 'prod_UfT00V9zFyJOM7', pricePerUnit: 1.45, name: 'Professional Tier' };
      case 'plus':
        return { productId: 'prod_UfSyVFRhZUqdiq', pricePerUnit: 3.00, name: 'Plus Tier' };
      default:
        return { productId: 'prod_Ueztggr15cNscz', pricePerUnit: 5.00, name: 'No Active Plan' };
    }
  }

  const handleTopUpClick = async () => {
    if (!subStatus?.plan) return
    const { productId } = getTopUpDetails(subStatus.plan)
    if (!productId) return
    setLoadingTopUp(true)
    try {
      await handleCheckout(productId, 'payment', selectedQuantity, selectedQuantity)
    } finally {
      setLoadingTopUp(false)
    }
  }

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
    <div className="min-h-screen flex flex-col relative bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] overflow-x-hidden text-slate-100">
      {/* RICH LIGHT THEMED BACKGROUND INSPIRED BY IMAGE */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Clean background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F]" />

        {/* Decorative Gear elements - clean static white vector */}
        <div className="absolute top-[10%] left-[5%] opacity-10 rotate-12 text-white">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 pt-32 pb-20 px-6 md:px-10 max-w-[850px] mx-auto">
        {isLoadingSub ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading profile...</p>
          </div>
        ) : subStatus && subStatus.credits === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[3rem] p-10 md:p-12 shadow-lg space-y-8 relative overflow-hidden group text-center py-16 animate-in fade-in zoom-in duration-500">
            <div className="relative z-10 max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined text-[#D97706] text-5xl">warning</span>
              </div>
              
              <div className="space-y-3">
                <h2 className="font-headline text-3xl font-black text-[#1E1A5F] tracking-tight uppercase">Out of Credits</h2>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  You have used all available contract scans.{" "}
                  {subStatus.nextBillingDate && getTierQuotaCredits(subStatus.plan) > 0 ? (
                    <span>
                      You will receive {getTierQuotaCredits(subStatus.plan)} new credits on{" "}
                      {new Date(subStatus.nextBillingDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
                      {" "}Would you like to purchase top ups in the meantime?
                    </span>
                  ) : (
                    <span>Select the number of top-up scans you would like below to continue auditing.</span>
                  )}
                </p>
              </div>

              {/* Slider UI */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 space-y-4 text-left">
                <div className="flex justify-between items-center text-sm font-bold text-[#1E1A5F]">
                  <span>Tier: {getTopUpDetails(subStatus.plan).name}</span>
                  <span className="text-[#D84C9F] font-mono">${getTopUpDetails(subStatus.plan).pricePerUnit.toFixed(2)} / scan</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-[#64748B] font-bold">
                    <span>1 Scan</span>
                    <span>100 Scans</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#D84C9F]"
                  />
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-[#E2E8F0]">
                  <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Total Quantity:</span>
                  <span className="text-lg font-black text-[#1E1A5F] font-mono">{selectedQuantity} Scans</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Total Cost:</span>
                  <span className="text-2xl font-black text-[#16A34A] font-mono">${(selectedQuantity * getTopUpDetails(subStatus.plan).pricePerUnit).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleTopUpClick}
                disabled={loadingTopUp}
                className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-bold text-sm tracking-wide shadow-md hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              >
                {loadingTopUp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Redirecting to Checkout...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    <span>Purchase {selectedQuantity} Scans for ${(selectedQuantity * getTopUpDetails(subStatus.plan).pricePerUnit).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">

            {/* MAIN UPLOAD CARD - Clean solid white card with simple border and shadow */}
            <section className="bg-white border border-[#E2E8F0] rounded-[3rem] p-10 md:p-12 shadow-xl space-y-10 relative overflow-hidden group">
              <div className="space-y-4 text-center relative z-10">
                <h1 className="font-headline text-5xl font-bold tracking-tight text-[#1E1A5F] leading-tight">
                  Contract Analysis <br />
                  <span className="bg-gradient-to-r from-[#D84C9F] to-[#2E1E96] bg-clip-text text-transparent">& Risk Detection</span>
                </h1>
                <p className="text-[#64748B] text-lg leading-relaxed max-w-xl mx-auto">
                  Scan for hidden traps and unfavorable clauses with our AI-powered engine.
                </p>
              </div>

              <div
                onClick={analysisComplete || isAnalyzing ? undefined : openFilePicker}
                onDrop={analysisComplete || isAnalyzing ? undefined : handleDrop}
                onDragOver={analysisComplete || isAnalyzing ? undefined : handleDragOver}
                onDragLeave={analysisComplete || isAnalyzing ? undefined : handleDragLeave}
                className={`flex flex-col items-center justify-center gap-8 border-2 border-dashed rounded-[2.5rem] min-h-[400px] transition-all relative overflow-hidden group/drop
                  ${isDragging ? 'border-[#D84C9F] bg-[#FDF2F8]' : 'border-[#CBD5E1] hover:border-[#D84C9F] bg-[#F8FAFC]'}
                  ${analysisComplete || isAnalyzing ? 'cursor-default border-solid border-[#E2E8F0]' : 'cursor-pointer animate-in fade-in zoom-in duration-500'}`}
              >
                {!isAnalyzing && !analysisComplete && !file ? (
                  <div className="text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#2E1E96] to-[#D84C9F] flex items-center justify-center mx-auto shadow-lg group-hover/drop:scale-110 transition-transform duration-500">
                      <span className="material-symbols-outlined text-white text-5xl">cloud_upload</span>
                    </div>
                    <div className="space-y-4">
                      <div className="inline-block px-10 py-5 rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-bold text-lg hover:-translate-y-1 active:scale-95 transition-all cursor-pointer shadow-md">
                        Add Document
                      </div>
                      <p className="text-[#1E1A5F] font-black uppercase tracking-[3px] text-[11px] opacity-90">DRAG & DROP OR CLICK TO UPLOAD</p>
                      <p className="text-[#64748B] text-[10px] uppercase tracking-widest bg-[#EDF2F7] inline-block px-4 py-1.5 rounded-full border border-[#E2E8F0]">PDF, DOCX, or TXT files</p>
                    </div>

                    <div className="flex gap-8 justify-center pt-2 grayscale opacity-40 group-hover/drop:grayscale-0 group-hover/drop:opacity-80 transition-all duration-700">
                      <span className="material-symbols-outlined text-red-500 scale-110">picture_as_pdf</span>
                      <span className="material-symbols-outlined text-blue-500 scale-110">description</span>
                      <span className="material-symbols-outlined text-slate-100 scale-110">subject</span>
                    </div>
                  </div>
                ) : !isAnalyzing && !analysisComplete && file ? (
                  <div className="w-full max-w-sm space-y-10 p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center mb-10">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#2E1E96] to-[#D84C9F] flex items-center justify-center shadow-lg">
                          <span className="material-symbols-outlined text-white text-5xl">insert_drive_file</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[#1E1A5F] uppercase tracking-[4px]">Document Ready</p>
                      <p className="text-xs text-[#64748B] font-mono mt-2 break-all">{file.name}</p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="flex-1 px-6 py-4 rounded-xl border border-[#E2E8F0] text-[#64748B] font-bold text-xs uppercase tracking-[2px] hover:bg-[#F8FAFC] transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRealAnalysis(); }}
                        className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] text-white font-bold text-xs uppercase tracking-[3px] hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md"
                      >
                        Scan Contract
                      </button>
                    </div>
                  </div>
                ) : isAnalyzing && !analysisComplete ? (
                  <div className="w-full max-w-sm space-y-10 p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center mb-10">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-[#2E1E96]/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-[#D84C9F] border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#D84C9F] animate-pulse">auto_awesome</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-[#1E1A5F] uppercase tracking-[4px]">Audit in Transit</p>
                    </div>

                    <div className="space-y-8 relative">
                      <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-[#E2E8F0]" />
                      {workflow.map((step, idx) => (
                        <div key={idx} className="flex gap-8 items-start relative z-10 group/step">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition-all duration-700
                                ${step.status === 'complete' ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-md' :
                              step.status === 'active' ? 'bg-[#D84C9F] text-white shadow-md scale-110' :
                                'bg-[#F1F5F9] border border-[#E2E8F0] text-[#94A3B8]'}`}>
                            {step.status === 'complete' ? <span className="material-symbols-outlined text-sm">check</span> : step.number}
                          </div>
                          <div className="space-y-1">
                            <p className={`text-sm font-bold tracking-tight ${step.status === 'locked' ? 'text-[#94A3B8]' : 'text-[#1E1A5F]'}`}>{step.label}</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'active' ? 'bg-[#D84C9F] animate-pulse' : 'bg-slate-300'}`} />
                              <p className="text-[10px] font-black uppercase tracking-[2px] text-[#64748B]">
                                {step.subtext}
                              </p>
                            </div>
                            {step.status === 'active' && step.number === 2 && currentContractId && (
                              <div className="mt-4 scale-90 origin-left">
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
                ) : (
                  <div className="text-center space-y-10 animate-in zoom-in fade-in duration-700 py-10">
                    <div className="relative w-32 h-32 mx-auto">
                      <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#16A34A] to-[#4ADE80] flex items-center justify-center border border-[#E2E8F0] shadow-lg">
                        <span className="material-symbols-outlined text-white text-6xl">verified</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-[#1E1A5F] tracking-tighter uppercase leading-none">Scanned & Secured</h3>
                      <p className="text-[#64748B] font-medium">Your professional risk report is ready for review.</p>
                    </div>
                    <button
                      onClick={() => currentContractId && (window.location.href = `/analysis?id=${currentContractId}`)}
                      className="group relative inline-flex items-center justify-center px-12 py-5 space-x-4 font-bold text-white transition-all rounded-2xl bg-gradient-to-r from-[#D84C9F] to-[#DE5298] hover:scale-105 active:scale-95 text-lg shadow-md overflow-hidden cursor-pointer"
                    >
                      <span>VIEW DETAILED REPORT</span>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {!file && !isAnalyzing && !analysisComplete && (
              <section className="bg-white border border-[#E2E8F0] rounded-[3rem] p-10 md:p-12 space-y-10 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-2xl font-bold text-[#1E1A5F] tracking-tight">Alternative: <span className="text-[#64748B]">Copy-Paste</span></h3>
                  <span className="text-[10px] font-black uppercase tracking-[4px] bg-[#FDF2F8] text-[#D84C9F] border border-[#FCE7F3] px-4 py-1.5 rounded-full">MANUAL ENTRY</span>
                </div>

                <div className="relative group">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Insert your contract text here for immediate AI processing..."
                    className="relative w-full h-56 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2rem] p-8 font-mono text-sm text-[#1E1A5F] focus:outline-none focus:border-[#D84C9F]/50 focus:bg-white transition-all placeholder:text-[#94A3B8] resize-none shadow-inner"
                  />
                </div>

                <div className="flex justify-end relative z-10">
                  <button
                    onClick={handleRealAnalysis}
                    className="flex items-center gap-4 px-10 py-5 rounded-2xl border border-[#E2E8F0] hover:bg-[#F8FAFC] active:scale-95 transition-all font-black text-[#1E1A5F] text-xs uppercase tracking-[3px] cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-[#D84C9F] text-xl group-hover:scale-125 transition-transform">content_paste</span>
                    Paste Text & Analyze
                  </button>
                </div>
              </section>
            )}

            {/* Footer Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-12 pt-8 text-white/60">
              <div className="flex items-center gap-4 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[#D84C9F] text-sm">enhanced_encryption</span>
                <span className="text-xs font-bold uppercase tracking-[2px]">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-4 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-cyan-400 text-sm">bolt</span>
                <span className="text-xs font-bold uppercase tracking-[2px]">Real-time auditing</span>
              </div>
              <div className="flex items-center gap-4 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[#D84C9F] text-sm">token</span>
                <span className="text-xs font-bold uppercase tracking-[2px]">1 Credit Per Scan</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer className="relative z-[1]" />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt"
        onChange={onFileChange}
      />
    </div>
  )
}
