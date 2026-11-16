import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useServerFn } from "@tanstack/react-start"
import { PageHero } from "../components/PageHero"
import { listReviews, submitReview } from "../server/reviews.functions"
import { ReviewStars } from "../components/ReviewStars"
import { Star } from "lucide-react"

export const Route = createFileRoute("/reviews")({
  loader: () => listReviews(),
  component: ReviewsPage,
})

function ReviewsPage() {
  const initialReviews = Route.useLoaderData()
  const submitReviewFn = useServerFn(submitReview)

  const [reviews, setReviews] = useState(initialReviews)
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [thanks, setThanks] = useState(false)

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const row = await submitReviewFn({ data: { customerName: name, rating, comment } })
      setReviews((prev) => [row, ...prev])
      setName("")
      setComment("")
      setRating(5)
      setThanks(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHero title="Customer Reviews" subtitle="See what homeowners and businesses say about working with us." compact />

      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 justify-center mb-10">
            <ReviewStars rating={Math.round(avgRating)} size={22} />
            <span className="font-semibold text-slate-800">{avgRating.toFixed(1)} / 5</span>
            <span className="text-slate-500 text-sm">({reviews.length} reviews)</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 p-6 shadow-sm">
              <ReviewStars rating={r.rating} />
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
              <p className="mt-3 text-sm font-semibold text-slate-800">{r.customerName}</p>
              {r.serviceType && <p className="text-xs text-slate-400">{r.serviceType}</p>}
            </div>
          ))}
        </div>

        <div className="max-w-lg mx-auto rounded-xl border border-slate-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Leave a Review</h2>
          {thanks && <p className="text-sm text-green-600 mb-4">Thank you for your feedback!</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Your Name" required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Rating:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} className="p-0.5">
                  <Star width={20} height={20} className={n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                </button>
              ))}
            </div>
            <textarea placeholder="Tell us about your experience..." required rows={4} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
            <button type="submit" disabled={submitting} className="w-full rounded-md bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
