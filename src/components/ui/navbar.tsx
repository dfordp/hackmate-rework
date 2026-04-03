'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { Chakra_Petch } from 'next/font/google'
import { cn } from '@/lib/utils'

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const Navbar = () => {
  return (
    <div className="w-full z-40 flex justify-center">
      <nav 
        className={cn(
          "flex items-center w-full h-16 bg-neutral-900/20 backdrop-blur-md border-b border-neutral-800/30 shadow-lg"
        )}
      >
        <div className="w-full transition-all duration-300 ease-out container mx-auto px-4">
          <div className="flex items-center justify-between w-full h-full">
            {/* Logo - Far Left */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="flex items-center justify-center">
                  <Zap className="text-blue-500/40 h-6 w-6 mr-1" />
                  <div className={`${chakraPetch.className} text-lg md:text-xl text-white/85 select-none whitespace-nowrap`}>
                    HackMate
                  </div>
                </div>
              </Link>
            </div>
            
            {/* Right side - Empty during pause */}
            <div className="flex items-center space-x-4">
              {/* Placeholder for future content */}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
