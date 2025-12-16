'use client'

import dynamic from 'next/dynamic'
import type { ComponentType, ReactNode } from 'react'

// Dynamically import framer-motion components with SSR disabled
export const motion = {
  div: dynamic(() => import('framer-motion').then((mod) => mod.motion.div), {
    ssr: false,
  }) as ComponentType<any>,
  span: dynamic(() => import('framer-motion').then((mod) => mod.motion.span), {
    ssr: false,
  }) as ComponentType<any>,
  h1: dynamic(() => import('framer-motion').then((mod) => mod.motion.h1), {
    ssr: false,
  }) as ComponentType<any>,
  p: dynamic(() => import('framer-motion').then((mod) => mod.motion.p), {
    ssr: false,
  }) as ComponentType<any>,
  button: dynamic(() => import('framer-motion').then((mod) => mod.motion.button), {
    ssr: false,
  }) as ComponentType<any>,
  nav: dynamic(() => import('framer-motion').then((mod) => mod.motion.nav), {
    ssr: false,
  }) as ComponentType<any>,
  path: dynamic(() => import('framer-motion').then((mod) => mod.motion.path), {
    ssr: false,
  }) as ComponentType<any>,
}

// Dynamic AnimatePresence to avoid SSR issues
export const AnimatePresence = dynamic(
  () => import('framer-motion').then((mod) => mod.AnimatePresence),
  { ssr: false }
) as ComponentType<{ children?: ReactNode; mode?: 'wait' | 'sync' | 'popLayout' }>
