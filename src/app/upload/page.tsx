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
    <div className="min-h-screen relative bg-[#0B0B1E] overflow-x-hidden text-slate-200">
      {/* RICH THEMED BACKGROUND INSPIRED BY IMAGE */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Main Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B] via-[#0B0B1E] to-[#2E1065]" />

        {/* Animated Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/10 blur-[100px] rounded-full animate-float" />

        {/* Decorative Gear elements (from the user image) */}
        <div className="absolute top-[10%] left-[5%] opacity-10 rotate-12">
          <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
        <div className="absolute top-[40%] right-[5%] opacity-5 -rotate-12">
          <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2 2 2 0 0 1-2 2 2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2 2 2 0 0 1 2 2 2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2 2 2 0 0 1 2-2 2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2 2 2 0 0 1-2-2 2 2 0 0 0-2-2z"></path>
          </svg>
        </div>

        {/* Floating Rings */}
        <div className="absolute top-[15%] right-[20%] w-64 h-64 border border-white/5 rounded-full" />
        <div className="absolute top-[12%] right-[17%] w-80 h-80 border border-white/5 rounded-full" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 pt-32 pb-20 px-6 md:px-10 max-w-[850px] mx-auto">
        {isLoadingSub ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Loading profile...</p>
          </div>
        ) : subStatus && subStatus.credits === 0 ? (
          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] space-y-8 relative overflow-hidden group text-center py-16 animate-in fade-in zoom-in duration-500">
            {/* Corner Glovers */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 blur-[60px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/20 blur-[60px] rounded-full" />
            
            <div className="relative z-10 max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto shadow-xl">
                <span className="material-symbols-outlined text-amber-500 text-5xl">warning</span>
              </div>
              
              <div className="space-y-3">
                <h2 className="font-headline text-3xl font-black text-white tracking-tight uppercase">Out of Credits</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
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
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 text-left">
                <div className="flex justify-between items-center text-sm font-bold text-slate-300">
                  <span>Tier: {getTopUpDetails(subStatus.plan).name}</span>
                  <span className="text-indigo-400 font-mono">${getTopUpDetails(subStatus.plan).pricePerUnit.toFixed(2)} / scan</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 font-bold">
                    <span>1 Scan</span>
                    <span>100 Scans</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
                  />
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Quantity:</span>
                  <span className="text-lg font-black text-white font-mono">{selectedQuantity} Scans</span>
                </div>
                
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Cost:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">${(selectedQuantity * getTopUpDetails(subStatus.plan).pricePerUnit).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleTopUpClick}
                disabled={loadingTopUp}
                className="w-full py-5 px-8 rounded-2xl bg-[#4F46E5] text-white font-bold text-sm tracking-wide shadow-[0_10px_20px_rgba(79,70,229,0.25)] hover:bg-[#4338CA] hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
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

            {/* MAIN UPLOAD CARD - Enhanced Glassmorphism */}
            <section className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] space-y-10 relative overflow-hidden group">
              {/* Corner Glovers */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 blur-[60px] rounded-full group-hover:bg-cyan-500/30 transition-all duration-700" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[60px] rounded-full group-hover:bg-purple-500/30 transition-all duration-700" />

              <div className="space-y-4 text-center relative z-10">
                <h1 className="font-headline text-5xl font-bold tracking-tight text-white leading-tight">
                  Contract Analysis <br />
                  <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">& Risk Detection</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
                  Scan for hidden traps and unfavorable clauses with our AI-powered engine.
                </p>
              </div>

              <div
                onClick={analysisComplete || isAnalyzing ? undefined : openFilePicker}
                onDrop={analysisComplete || isAnalyzing ? undefined : handleDrop}
                onDragOver={analysisComplete || isAnalyzing ? undefined : handleDragOver}
                onDragLeave={analysisComplete || isAnalyzing ? undefined : handleDragLeave}
                className={`flex flex-col items-center justify-center gap-8 border-2 border-dashed rounded-[2.5rem] min-h-[400px] transition-all relative overflow-hidden group/drop
                  ${isDragging ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/10 hover:border-white/20 bg-white/[0.01]'}
                  ${analysisComplete || isAnalyzing ? 'cursor-default border-solid border-white/5' : 'cursor-pointer animate-in fade-in zoom-in duration-500'}`}
              >
                {!isAnalyzing && !analysisComplete ? (
                  <div className="text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center mx-auto shadow-2xl group-hover/drop:scale-110 transition-transform duration-500">
                      <span className="material-symbols-outlined text-white text-5xl">cloud_upload</span>
                    </div>
                    <div className="space-y-4">
                      <div className="inline-block px-10 py-5 rounded-2xl bg-white text-indigo-950 font-bold text-lg shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:scale-95 transition-all">
                        Add Document
                      </div>
                      <p className="text-white font-black uppercase tracking-[3px] text-[11px] opacity-80">DRAG & DROP OR CLICK TO UPLOAD</p>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest bg-white/5 inline-block px-4 py-1.5 rounded-full border border-white/5">PDF, DOCX, JPG, PNG, or Text</p>
                    </div>

                    <div className="flex gap-8 justify-center pt-2 grayscale opacity-40 group-hover/drop:grayscale-0 group-hover/drop:opacity-80 transition-all duration-700">
                      <span className="material-symbols-outlined text-red-500 scale-110">picture_as_pdf</span>
                      <span className="material-symbols-outlined text-blue-500 scale-110">description</span>
                      <span className="material-symbols-outlined text-emerald-500 scale-110">image</span>
                      <span className="material-symbols-outlined text-slate-100 scale-110">subject</span>
                    </div>
                  </div>
                ) : isAnalyzing && !analysisComplete ? (
                  <div className="w-full max-w-sm space-y-10 p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center mb-10">
                      <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-indigo-400 animate-pulse">auto_awesome</span>
                        </div>
                      </div>
                      <p className="text-sm font-black text-white uppercase tracking-[4px]">Audit in Transit</p>
                    </div>

                    <div className="space-y-8 relative">
                      <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-white/5" />
                      {workflow.map((step, idx) => (
                        <div key={idx} className="flex gap-8 items-start relative z-10 group/step">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition-all duration-700
                                ${step.status === 'complete' ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)]' :
                              step.status === 'active' ? 'bg-white text-indigo-950 shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-110' :
                                'bg-white/5 border border-white/10 text-slate-600'}`}>
                            {step.status === 'complete' ? <span className="material-symbols-outlined text-sm">check</span> : step.number}
                          </div>
                          <div className="space-y-1">
                            <p className={`text-sm font-bold tracking-tight ${step.status === 'locked' ? 'text-slate-600' : 'text-slate-100'}`}>{step.label}</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'active' ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                              <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">
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
                      <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                      <div className="relative w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center border border-white/20 shadow-2xl">
                        <span className="material-symbols-outlined text-white text-6xl">verified</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Scanned & Secured</h3>
                      <p className="text-slate-400 font-medium">Your professional risk report is ready for review.</p>
                    </div>
                    <button
                      onClick={() => currentContractId && (window.location.href = `/analysis?id=${currentContractId}`)}
                      className="group relative inline-flex items-center justify-center px-12 py-5 space-x-4 font-black text-indigo-950 transition-all rounded-2xl bg-white hover:scale-105 active:scale-95 text-lg shadow-[0_20px_40px_rgba(255,255,255,0.1)] overflow-hidden cursor-pointer"
                    >
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-400 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform" />
                      <span>VIEW DETAILED REPORT</span>
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* PASTE SECTION / FILE PREVIEW */}
            {file && !isAnalyzing && !analysisComplete && (
              <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white text-3xl">insert_drive_file</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg tracking-tight leading-tight">{file.name}</p>
                    <p className="text-xs text-slate-500 font-mono tracking-widest mt-1 uppercase">{(file.size / 1024).toFixed(1)} KB — VERIFIED</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <button
                    onClick={removeFile}
                    className="flex-1 md:flex-none px-8 py-4 rounded-xl border border-white/10 text-slate-400 font-bold text-xs uppercase tracking-[2px] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRealAnalysis}
                    className="flex-1 md:flex-none px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 animate-gradient text-white font-black text-xs uppercase tracking-[3px] shadow-[0_10px_30px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Scan Contract
                  </button>
                </div>
              </div>
            )}

            {!file && !isAnalyzing && !analysisComplete && (
              <section className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 md:p-12 space-y-10 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Alternative: <span className="text-slate-500">Copy-Paste</span></h3>
                  <span className="text-[10px] font-black uppercase tracking-[4px] bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/20">MANUAL ENTRY</span>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000" />
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Insert your contract text here for immediate AI processing..."
                    className="relative w-full h-56 bg-black/40 border border-white/5 rounded-[2rem] p-8 font-mono text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-700 resize-none shadow-inner"
                  />
                </div>

                <div className="flex justify-end relative z-10">
                  <button
                    onClick={handleRealAnalysis}
                    className="flex items-center gap-4 px-10 py-5 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/20 active:scale-95 transition-all font-black text-white text-xs uppercase tracking-[3px] cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-indigo-400 text-xl group-hover:scale-125 transition-transform">content_paste</span>
                    Paste Text & Analyze
                  </button>
                </div>
              </section>
            )}

            {/* Footer Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-12 pt-8 opacity-40">
              <div className="flex items-center gap-4 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-cyan-400 text-sm">enhanced_encryption</span>
                <span className="text-[10px] font-black uppercase tracking-[4px]">Bank-Level Security</span>
              </div>
              <div className="flex items-center gap-4 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-indigo-400 text-sm">bolt</span>
                <span className="text-[10px] font-black uppercase tracking-[4px]">Real-time auditing</span>
              </div>
              <div className="flex items-center gap-4 hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-purple-400 text-sm">token</span>
                <span className="text-[10px] font-black uppercase tracking-[4px]">1 Credit Per Scan</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
        onChange={onFileChange}
      />

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  )
}
