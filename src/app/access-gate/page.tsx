'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AccessGatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get('next') || '/'

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/access-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, next }),
      })

      if (res.ok) {
        const { redirectTo } = await res.json()
        router.push(redirectTo)
        router.refresh()
      } else {
        setError('Incorrect password. Please try again.')
        setPassword('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{
        background: 'radial-gradient(ellipse at 60% 20%, #3B1D8B 0%, #1E1A5F 45%, #0B0826 100%)',
      }}
    >
      {/* Ambient glow orbs */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(216,76,159,0.18) 0%, transparent 70%)',
            top: '-10%',
            right: '-5%',
            filter: 'blur(40px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(123,44,191,0.2) 0%, transparent 70%)',
            bottom: '5%',
            left: '-5%',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 420,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="Brand Deal Fixer"
            width={64}
            height={64}
            style={{ margin: '0 auto 16px', display: 'block' }}
          />
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 26,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Brand Deal{' '}
            <span style={{ color: '#D84C9F' }}>Fixer</span>
          </h1>
        </div>

        {/* Card */}
        <form
          id="access-gate-form"
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 28,
            padding: '40px 36px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
          }}
        >
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
              margin: '0 0 8px',
              textAlign: 'center',
            }}
          >
            Preview Access
          </p>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              color: 'rgba(255,255,255,0.55)',
              margin: '0 0 28px',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            This app is currently in private beta. Enter the access password to continue.
          </p>

          <label
            htmlFor="gate-password"
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 8,
            }}
          >
            Password
          </label>

          <input
            ref={inputRef}
            id="gate-password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter access password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
            required
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: error
                ? '1px solid rgba(239,68,68,0.7)'
                : '1px solid rgba(255,255,255,0.11)',
              borderRadius: 14,
              padding: '14px 18px',
              color: '#FFFFFF',
              fontSize: 15,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              marginBottom: 8,
            }}
          />

          {error && (
            <p
              role="alert"
              style={{
                color: '#EF4444',
                fontSize: 13,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 600,
                margin: '0 0 16px',
              }}
            >
              {error}
            </p>
          )}

          <button
            id="access-gate-submit"
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              marginTop: error ? 0 : 8,
              padding: '15px',
              background: loading
                ? 'rgba(216,76,159,0.5)'
                : 'linear-gradient(135deg, #D84C9F 0%, #7B2CBF 100%)',
              border: 'none',
              borderRadius: 14,
              color: '#FFFFFF',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s, transform 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                Verifying…
              </>
            ) : (
              'Access Site →'
            )}
          </button>
        </form>

        {/* Public links */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 13,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Public pages:{' '}
          <a href="/" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>
            Home
          </a>
          {' · '}
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>
            Privacy
          </a>
          {' · '}
          <a href="/terms" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>
            Terms
          </a>
          {' · '}
          <a href="/support" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>
            Support
          </a>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        #gate-password:focus {
          border-color: rgba(216,76,159,0.6) !important;
          background: rgba(255,255,255,0.09) !important;
        }
        #access-gate-submit:not(:disabled):hover {
          opacity: 0.92;
          transform: scale(1.01);
        }
      `}</style>
    </div>
  )
}
