'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

interface ContractMonitorProps {
  contractId: string;
  initialStatus?: string;
  onComplete?: () => void;
}

export default function ContractMonitor({ contractId, initialStatus = 'pending', onComplete }: ContractMonitorProps) {
  const [status, setStatus] = useState<string>(initialStatus);
  const [isError, setIsError] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!contractId) return;

    // 1. Initial State Sync
    setStatus(initialStatus);

    // 2. Real-time Subscription Strategy
    const channel = supabase
      .channel(`contract_status_${contractId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contracts',
          filter: `id=eq.${contractId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          console.log(`[REALTIME] Status transition: ${status} -> ${newStatus}`);
          setStatus(newStatus);
          
          if (newStatus === 'completed') {
            if (onComplete) onComplete();
          }
        }
      )
      .subscribe((subStatus) => {
        if (subStatus === 'CHANNEL_ERROR') {
          console.error('[REALTIME] Subscription error');
          setIsError(true);
        }
      });

    // 3. Proper Cleanup logic
    return () => {
      console.log(`[REALTIME] Cleaning up channel for ${contractId}`);
      supabase.removeChannel(channel);
    };
  }, [contractId, initialStatus, onComplete]);

  // UI Helper: Get color and icon based on status
  const getStatusConfig = (currentStatus: string) => {
    switch (currentStatus) {
      case 'completed':
        return {
          label: 'Scan Successful',
          color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
          icon: <CheckCircle2 className="w-4 h-4 mr-2" />,
          isDone: true
        };
      case 'analyzing':
        return {
          label: 'AI Analysis in Progress...',
          color: 'text-primary bg-primary/10 border-primary/20',
          icon: <Loader2 className="w-4 h-4 mr-2 animate-spin" />,
          isDone: false
        };
      case 'failed':
        return {
          label: 'Analysis Failed',
          color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
          icon: <AlertCircle className="w-4 h-4 mr-2" />,
          isDone: true
        };
      default:
        return {
          label: 'Waking up the models...',
          color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
          icon: <Loader2 className="w-4 h-4 mr-2" />,
          isDone: false
        };
    }
  };

  const config = getStatusConfig(status);

  if (isError) {
    return (
      <div className="flex items-center p-3 text-xs rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 mt-2">
        <AlertCircle className="w-3 h-3 mr-2" />
        Connection lost. Please refresh.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-1 duration-500">
      <div className={`flex items-center px-4 py-1.5 text-xs font-medium rounded-full border ${config.color} w-fit`}>
        {config.icon}
        {config.label}
      </div>
    </div>
  );
}
