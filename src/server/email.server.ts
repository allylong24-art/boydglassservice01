// Sends transactional email via Resend if RESEND_API_KEY is configured.
// Falls back to a no-op log so booking flows never fail when email isn't set up yet.
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || "Boyd Glass Service <onboarding@resend.dev>"

  if (!apiKey) {
    console.log(`[email:skipped] RESEND_API_KEY not set. Would send "${opts.subject}" to ${opts.to}`)
    return { skipped: true }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) {
      console.error("[email:error]", await res.text())
      return { skipped: false, ok: false }
    }
    return { skipped: false, ok: true }
  } catch (err) {
    console.error("[email:error]", err)
    return { skipped: false, ok: false }
  }
}
