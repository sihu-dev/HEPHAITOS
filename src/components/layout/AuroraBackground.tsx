'use client'

import { memo } from 'react'

/**
 * Aurora Background Effect
 * Linear-inspired ambient background with floating gradients
 */
export const AuroraBackground = memo(function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#0D0D0F] overflow-hidden">
      {/* Aurora Layers */}
      <div className="absolute inset-0">
        {/* Layer 1: Primary Purple */}
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(94,106,210,0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'aurora-float 20s ease-in-out infinite',
          }}
        />

        {/* Layer 2: Primary Light */}
        <div
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(124,138,234,0.3) 0%, transparent 70%)',
            filter: 'blur(70px)',
            animation: 'aurora-float-reverse 25s ease-in-out infinite',
          }}
        />

        {/* Layer 3: Accent */}
        <div
          className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(94,106,210,0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'aurora-float-slow 30s ease-in-out infinite',
          }}
        />
      </div>

      {/* Noise Overlay for Texture */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
        }}
      />
    </div>
  )
})

AuroraBackground.displayName = 'AuroraBackground'

export { AuroraBackground as default }
