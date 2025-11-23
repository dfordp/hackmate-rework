import { useMotionValue, useTransform } from 'framer-motion'
import axios from 'axios'
import { User } from '../types'
import { useUser } from '@clerk/nextjs'

export function useSwipeActions(
  activeUser: User | null,
  currentIndex: number,
  totalUsers: number,
  setCurrentIndex: (index: number) => void,
  matches: string[],
  setMatches: (matches: string[]) => void,
  setSelectedMatch: (user: User | null) => void,
  setMatchDialogOpen: (open: boolean) => void,
  viewCurrentProfile: () => void,
  incomingMatchIds: string[],
  setIncomingMatchIds: (ids: string[]) => void
) {
  const { user } = useUser()

  // Motion values for swipe animations
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-30, 0, 30])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  // LIKE/NOPE indicators
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.5, 1])
  const nopeOpacity = useTransform(x, [-200, -100, 0], [1, 0.5, 0])

  // Handle like action
  const handleLike = async (): Promise<void> => {
    if (!activeUser) return

    try {
      // Mark profile as viewed using the provided function
      viewCurrentProfile()

      // Check if this is a mutual match (they already liked you)
      const isMutualMatch = incomingMatchIds.includes(activeUser.id)

      // Call the API to register the like
      await axios.post('/api/like', {
        userId: user?.id,
        likedUserId: activeUser.id
      })

      // If it's a mutual match, remove from incoming matches
      if (isMutualMatch) {
        setIncomingMatchIds(incomingMatchIds.filter(id => id !== activeUser.id))
        setMatches([...matches, activeUser.id])
        setSelectedMatch(activeUser)
        setMatchDialogOpen(true)
      }

      // Animate card off screen
      x.set(500)

      // Move to next user after animation
      setTimeout(() => {
        setCurrentIndex(Math.min(currentIndex + 1, totalUsers))
        x.set(0) // Reset for next card
      }, 300)
    } catch (error) {
      console.error('Error liking profile:', error)
      x.set(0) // Reset on error
    }
  }

  // Handle pass action
  const handlePass = async (): Promise<void> => {
    if (!activeUser) return

    try {
      // Mark profile as viewed using the provided function
      viewCurrentProfile()

      // Remove from incoming matches if they had liked you
      if (incomingMatchIds.includes(activeUser.id)) {
        setIncomingMatchIds(incomingMatchIds.filter(id => id !== activeUser.id))
      }

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
      console.error('Error passing profile:', error)
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