'use client';

import React, { useState } from 'react';
import { handleCheckout, CheckoutMode } from '@/lib/stripe-client';

interface CheckoutButtonProps {
  priceId: string;
  mode?: CheckoutMode;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A professional 'Buy Now' button with built-in loading state
 * and multi-click prevention.
 */
export const CheckoutButton = ({ 
  priceId, 
  mode = 'subscription', 
  className = "", 
  children 
}: CheckoutButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await handleCheckout(priceId, mode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center justify-center px-8 py-4 
        text-base font-bold text-white transition-all duration-300
        bg-blue-600 rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.2)]
        hover:bg-blue-700 hover:shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:-translate-y-0.5
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:bg-blue-300 disabled:cursor-not-allowed disabled:transform-none
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Creating Session...</span>
        </div>
      ) : (
        children || 'Get Started Now'
      )}
    </button>
  );
};
