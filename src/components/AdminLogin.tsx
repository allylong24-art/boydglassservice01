import { useState } from "react"
import { login, signup, requestPasswordRecovery, AuthError, MissingIdentityError } from "@netlify/identity"
import { Lock } from "lucide-react"

type Mode = "login" | "signup" | "recover"

const INPUT_CLASS =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"

function errorMessage(error: unknown, mode: Mode): string {
  if (error instanceof MissingIdentityError) {
    return "Identity isn't available here. Sign in on the deployed site, not a local dev server."
  }
  if (error instanceof AuthError) {
    switch (error.status) {
      case 401:
        return "Incorrect email or password."
      case 403:
        return mode === "signup"
          ? "New account registration is turned off for this site. Ask for an invite instead."
          : "That action isn't allowed for this site."
      case 404:
        return "No account found with that email address."
      case 422:
        return mode === "signup"
          ? "Check the email address, and use a password of at least 8 characters."
          : "Check the email address and password and try again."
      default:
        return error.message
    }
  }
  return "Something went wrong. Please try again."
}

export function AdminLogin() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === "recover") {
        await requestPasswordRecovery(email)
        setNotice("Password reset email sent. Click the link in it to get back into the dashboard.")
      } else if (mode === "signup") {
        const user = await signup(email, password)
        if (user.confirmedAt) {
          // Autoconfirm is on, so the session is already live and the
          // IdentityProvider's auth listener swaps in the dashboard.
          setNotice("Account created. Signing you in...")
        } else {
          setNotice("Account created. Check your email for a confirmation link, then sign in.")
          setMode("login")
          setPassword("")
        }
      } else {
        await login(email, password)
        // On success the dashboard replaces this form via the auth listener.
      }
    } catch (err) {
      setError(errorMessage(err, mode))
    } finally {
      setBusy(false)
    }
  }

  const submitLabel = mode === "recover" ? "Send Reset Email" : mode === "signup" ? "Create Account" : "Sign In"

  return (
    <div className="max-w-sm mx-auto py-24 px-4">
      <div className="text-center">
        <Lock className="h-10 w-10 text-blue-700 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          {mode === "signup" ? "Create Admin Account" : mode === "recover" ? "Reset Password" : "Admin Login"}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {mode === "signup"
            ? "Set up your Netlify Identity account to manage the site."
            : mode === "recover"
              ? "Enter your email and we'll send you a link to set a new password."
              : "Sign in with your Netlify Identity account to manage the site."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 p-6 shadow-sm text-left">
        <div>
          <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {mode !== "recover" && (
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Working..." : submitLabel}
        </button>

        <div className="flex justify-between text-xs">
          {mode === "login" ? (
            <>
              <button type="button" onClick={() => switchMode("recover")} className="text-blue-700 hover:underline">
                Forgot password?
              </button>
              <button type="button" onClick={() => switchMode("signup")} className="text-blue-700 hover:underline">
                Create an account
              </button>
            </>
          ) : (
            <button type="button" onClick={() => switchMode("login")} className="text-blue-700 hover:underline">
              Back to sign in
            </button>
          )}
        </div>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Identity sign-in only works on the deployed Netlify site, not on localhost.
      </p>
    </div>
  )
}
