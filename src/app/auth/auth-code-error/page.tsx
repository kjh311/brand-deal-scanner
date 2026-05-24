export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="font-headline text-3xl font-semibold tracking-tight text-on-surface mb-4">
          Authentication Error
        </h1>
        <p className="text-on-surface-variant mb-8">
          Sorry, we were unable to complete your sign-in. This can happen if the authentication link has expired or was already used.
        </p>
        <a 
          href="/login" 
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary/90 transition"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
