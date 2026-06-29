'use client'

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Zap} from "lucide-react"
import { Navbar } from "@/components/ui/navbar"
import { DevelopmentPauseBanner } from "@/components/ui/development-pause-banner"
import Spline from '@splinetool/react-spline'
import { M_PLUS_1p } from "next/font/google"
// import FixedBadges from "@/components/ui/fixed-badges"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"
import HowItWorks from "@/components/ui/how-it-works"
import Link from "next/link"
import { Chakra_Petch } from 'next/font/google'
import { Testimonials } from "@/components/ui/testimonials"
import Image from "next/image"

const mPlus1p = M_PLUS_1p({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700']
})

  
const chakraPetch = Chakra_Petch({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700']
})


export default function LandingPage() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  
  // Scroll to top on page load/refresh
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Handle CTA button click
  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/explore')
    } else {
      router.push('/sign-in')
    }
  }

  
  return (
    <div className="flex flex-col bg-black">
      <DevelopmentPauseBanner />
      <Navbar />
      
      <div className="min-h-screen flex flex-col">
      {/* Fixed badges for landing page only */}
      {/* <FixedBadges /> */}
      
      {/* Hero Section */}
      <main>
        <div className="container mx-auto px-6 pt-10 pb-6 md:py-2 relative">
          {/* Background GIF for Mobile Screens */}
          <div className="md:hidden absolute inset-0 z-0 opacity-35 flex items-center justify-center">
            <div className="w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] relative">
              <Image
                src="https://res.cloudinary.com/dlv779rl7/image/upload/v1758904247/Adobe_Express_-_Untitled_video_-_Made_with_Clipchamp_d7jpf2.gif"
                alt="3D Animation"
                fill
                style={{
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
                priority
                unoptimized // Allows GIF animation
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl md:text-6xl text-white/80 tracking-tight" style={{ ...mPlus1p.style, fontWeight: 600 }}>
                  <span className="text-primary block">Find Your Perfect</span>
                  <span className="block">Co-Founder</span>
                </h1>
                <p className="mt-4 text-neutral-600 dark:text-neutral-300/80" style={{ ...mPlus1p.style, fontWeight: 400 }}>
                  A swipe-based platform connecting founders and builders with their ideal collaborators. 
                  No social profiles, no fluff. Just raw experience, aligned intent, and mutual interest.
                </p>
              </div>
              <InteractiveHoverButton onClick={handleGetStarted}>
                Get Started
              </InteractiveHoverButton>
            </div>
            
            <div className="hidden md:block relative">
              <Spline
              style={{
                width: "100%",
                height: "100vh",
                pointerEvents: "auto",
              }}
              scene="https://prod.spline.design/z7hD8uCHC55lTHtO/scene.splinecode" 
              />
              <div 
              className="absolute pointer-events-none z-50"
              style={{
                backgroundColor: '#000000',
                bottom: '15px',
                right: '15px',
                width: '200px',
                height: '60px'
              }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* How it works */}
      <HowItWorks />

      <Testimonials />

      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-start">
            {/* Logo */}
            <Link href="/" className="flex items-center mb-3">
              <Zap className="text-blue-500/40 transition-all duration-300 ease-out mr-1" />
              <div className={`${chakraPetch.className} text-lg md:text-xl text-white/85 select-none whitespace-nowrap`}>
                HackMate
              </div>
            </Link>
            {/* Made by */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Made by{' '}
              <a
                href="https://dilpreetgrover.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-500"
              >
                Dilpreet Grover
              </a>
            </div>
            {/* All rights reserved */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Hackmate. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
