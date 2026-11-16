export function PageHero({
  title,
  subtitle,
  compact = false,
}: {
  title: string
  subtitle?: string
  compact?: boolean
}) {
  return (
    <div className={`bg-gradient-to-br from-blue-800 via-blue-700 to-slate-800 text-white ${compact ? "py-14" : "py-20"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-4 text-blue-100 text-lg max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    </div>
  )
}
