'use client'

import { X } from 'lucide-react'
import { useState } from 'react'

export const DevelopmentPauseBanner = () => {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="w-full bg-yellow-400 text-gray-900 px-4 py-4 flex items-center justify-center gap-4 relative z-50">
      <div className="text-center text-sm md:text-base font-semibold flex-1">
        🔬 App development has been paused while we complete an experiment.{' '}
        <a 
          href="https://www.dilpreetgrover.me/projects/hackmate"
          target="_blank" 
          rel="noopener noreferrer"
          className="underline font-bold hover:text-gray-700"
        >
          View the demo here
        </a>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="text-gray-900 hover:text-gray-700 flex-shrink-0"
        aria-label="Close banner"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
