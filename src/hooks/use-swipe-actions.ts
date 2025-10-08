/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useMotionValue, useTransform } from 'framer-motion'
import axios from 'axios'
import { User } from '../types'
import { useUser } from '@clerk/nextjs'
import { logger } from '@/lib/logger'

export function useSwipeActions(
  activeUser: User | null,
  currentIndex: number,
  totalUsers: number,
  setCurrentIndex: (index: number) => void,
  matches: string[],
  setMatches: (matches: string[]) => void,
  setSelectedMatch: (user: User | null) => void,
  setMatchDialogOpen: (open: boolean) => void,
  viewCurrentProfile: () => void // Add the viewCurrentProfile parameter
) {
  const {user} = useUser()

  // Motion values for swipe animations
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  // LIKE/NOPE indicators
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1])
  const nopeOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0])
  
  // Handle like action
  const handleLike = async () => {
    if (!activeUser) return
    
    try {
      // Mark profile as viewed using the provided function
      viewCurrentProfile();
      
      // Call the API to register the like
      const response = await axios.post('/api/like', {
        userId: user?.id,
        likedUserId: activeUser.id
      })
      
      // Animate card off screen
      x.set(500)
      
      // If a match occurred, show the match dialog
      if (response.data.isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setMatches((prev: any) => [...prev, activeUser.id])
        setSelectedMatch(activeUser)
        setMatchDialogOpen(true)
      }
      
      // Move to next user after animation
      setTimeout(() => {
        if (currentIndex < totalUsers - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          setCurrentIndex(totalUsers) // Show empty state
        }
        x.set(0) // Reset for next card
      }, 300)
      
    } catch (error) {
      logger.error('Error liking profile', { 
        error: (error as Error).message,
        userId: user?.id,
        likedUserId: activeUser?.id,
        action: 'like'
      })
      x.set(0) // Reset on error
    }
  }
  
  // Handle pass action
  const handlePass = async () => {
    if (!activeUser) return
    
    try {
      // Mark profile as viewed using the provided function
      viewCurrentProfile();
      
      // Call the API to register the pass
      await axios.post('/api/unlike', {
        userId: user?.id,
        unlikedUserId: activeUser.id
      })
      
      // Animate card off screen
      x.set(-500)
      
      // Move to next user after animation
      setTimeout(() => {
        if (currentIndex < totalUsers - 1) {
          setCurrentIndex(currentIndex + 1)
        } else {
          setCurrentIndex(totalUsers) // Show empty state
        }
        x.set(0) // Reset for next card
      }, 300)
      
    } catch (error) {
      logger.error('Error passing profile', { 
        error: (error as Error).message,
        userId: user?.id,
        passedUserId: activeUser?.id,
        action: 'pass'
      })
      x.set(0) // Reset on error
    }
  }
  
  return {
    x,
    rotate,
    opacity,
    likeOpacity,
    nopeOpacity,
    handleLike,
    handlePass
  }
}