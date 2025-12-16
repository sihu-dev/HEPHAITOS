'use client'

// Global error handler - must include its own html/body tags
// because it replaces the root layout when an error occurs
// Note: Cannot use i18n hooks here as this replaces root layout
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Error - HEPHAITOS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-[#0D0D0F]" suppressHydrationWarning>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-zinc-300 mb-4">
              Server Error
            </h2>
            <p className="text-zinc-500 mb-8">
              Please try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] hover:bg-[#7C8AEA] text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
