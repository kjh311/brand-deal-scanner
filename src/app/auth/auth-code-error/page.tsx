export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-[#221A7F] via-[#7B2CBF] to-[#D84C9F] px-6 text-white">
      <div className="max-w-md text-center">
        <h1 className="font-headline text-3xl font-semibold tracking-tight text-white mb-4">
          Authentication Error
        </h1>
        <p className="text-white/80 mb-8">
          Sorry, we were unable to complete your sign-in. This can happen if the authentication link has expired or was already used.
        </p>
        <a 
          href="/login" 
          className="inline-flex items-center justify-center rounded-full bg-white text-[#221A7F] px-6 py-3 text-sm font-semibold hover:bg-slate-100 transition"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
