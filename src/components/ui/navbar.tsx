'use client'

import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ModeToggle } from './toggle-button'
import { ChevronDown, Menu, UserRoundPen, UserSearch, Zap, Heart } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Button } from './button'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Chakra_Petch } from 'next/font/google'

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

export const Navbar = ({ showSignIn = true }: { showSignIn?: boolean }) => {
  const [scrolled, setScrolled] = useState(false)
  const { isSignedIn } = useUser()

  // Handle scroll effects with immediate state change for smooth CSS transitions
  useEffect(() => {
    const handleScroll = () => {
      const shouldScroll = window.scrollY > 50
      
      if (shouldScroll !== scrolled) {
        setScrolled(shouldScroll)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [scrolled])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <nav 
        className={cn(
          "flex items-center transform-gpu will-change-transform",
          // Width and border transitions - fast
          scrolled 
            ? "w-[90%] max-w-5xl transition-[width,border-radius] duration-300 ease-out" 
            : "w-full transition-[width,border-radius] duration-200 ease-in",
          // Background and positioning - separate timing
          scrolled 
            ? "mt-4 rounded-3xl bg-neutral-900/50 backdrop-blur-sm border border-gray-800/30 shadow-xl transition-[margin-top,background-color,box-shadow] duration-200 ease-out" 
            : "mt-0 rounded-none bg-neutral-900/20 backdrop-blur-md border-b border-neutral-800/30 shadow-lg transition-[margin-top,background-color,box-shadow] duration-200 ease-in"
        )}
      >
      <div className={cn(
        "w-full transition-all duration-300 ease-out",
        scrolled 
          ? "px-6 py-2" 
          : "container mx-auto px-4 py-0"
      )}>
        <div className={cn(
          "flex items-center justify-between w-full transition-all duration-300 ease-out",
          scrolled 
            ? "h-12" 
            : "h-16"
        )}>
          {/* Logo - Far Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="flex items-center justify-center">
                <Zap className={cn(
                  "text-blue-500/40 transition-all duration-300 ease-out mr-1",
                  scrolled ? "h-5 w-5" : "h-6 w-6"
                )} />
                <div className={`${chakraPetch.className} text-lg md:text-xl text-white/85 select-none whitespace-nowrap`}>
                  HackMate
                </div>
              </div>
            </Link>
          </div>
          
          {/* Navigation Items - Far Right */}
          <div className="flex items-center space-x-3 md:space-x-5">
            <div className="flex items-center space-x-3 md:space-x-4">
              {!scrolled && <ModeToggle />}
            
              {isSignedIn ? (
                <>
                  <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                          <Button 
                            variant={'outline'} 
                            className={cn(
                              'hover:cursor-pointer transition-all duration-300 ease-out',
                              scrolled ? 'h-9 px-3 text-sm' : ''
                            )}
                          >
                              <Menu className={cn(
                                'block md:hidden transition-all duration-300 ease-out',
                                scrolled ? 'h-4 w-4' : 'h-6 w-6'
                              )} />
                              <span className={cn(
                                'hidden md:block transition-all duration-300 ease-out',
                                scrolled ? 'text-sm' : ''
                              )}> Menu </span>
                              <ChevronDown className={cn(
                                'hidden md:block transition-all duration-300 ease-out',
                                scrolled ? 'h-4 w-4' : 'h-6 w-6'
                              )}/>
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="overflow-y-auto [&>*]:text-lg md:[&>*]:text-base [&>*]:hover:cursor-pointer">
                          <DropdownMenuItem>
                              <Link href={'/explore'} className='flex items-center gap-2'>
                                  <UserSearch className='h-8 w-8 md:h-6 md:w-6'/>
                                  <span> Explore </span>
                              </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                              <Link href={'/matches'} className='flex items-center gap-2'>
                                  <Heart className='h-8 w-8 md:h-6 md:w-6'/>
                                  <span> Matches </span>
                              </Link>
                          </DropdownMenuItem>         
                          <DropdownMenuItem>
                              <Link href={'/profile'} className='flex items-center gap-2'>
                                  <UserRoundPen className='h-8 w-8 md:h-6 md:w-6'/>
                                  <span> Profile </span>
                              </Link>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>

                  <UserButton appearance={{
                    elements: {
                      avatarBox: scrolled ? 'w-8 h-8' : 'w-10 h-10',
                      userButtonPopoverCard: 'shadow-xl',
                      userButtonMainIdentifier: 'font-semibold',
                    }
                  }}
                  />
                </>
                ) : (
                  showSignIn &&
                  <SignInButton>
                    <Button 
                    variant={'outline'} 
                      className={cn(
                        'hover:cursor-pointer transition-all duration-300 ease-out',
                        scrolled ? 'h-9 px-3 text-sm' : ''
                      )}
                    > Sign In </Button>
                  </SignInButton>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </nav>
    </div>
  )
}
