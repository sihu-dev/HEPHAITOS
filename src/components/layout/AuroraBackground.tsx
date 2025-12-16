'use client'

import { memo } from 'react'

/**
 * Simple Background
 * Supabase-inspired minimal dark background
 */
export const AuroraBackground = memo(function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0A0A0A]">
      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:64px_64px]"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 70%, transparent 100%)',
        }}
      />
    </div>
  )
})

AuroraBackground.displayName = 'AuroraBackground'

export { AuroraBackground as default }
