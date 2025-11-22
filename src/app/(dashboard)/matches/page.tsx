'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, Briefcase, Users, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import LoadingState from '@/components/ui/loading-state'
import ProfileDialog from '@/components/ui/profile-dialog'
import { M_PLUS_1p } from 'next/font/google'
import { motion } from 'framer-motion'
import Image from 'next/image'

const mPlus1p = M_PLUS_1p({
  subsets: ['latin'],
  weight: ['500', '700']
})

export default function MatchesPage() {
  const { user } = useUser()

  type Profile = {
    id: string
    name: string
    avatarUrl?: string
    location?: string
    currentRole?: string
    yearsExperience?: number
    skills?: string[]
  }

  type Match = {
    id: string
    mutual: boolean
    profile: Profile
    createdAt?: string
  }

  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user?.id) return
      
      try {
        const response = await axios.get(`/api/matches/${user.id}`)
        setMatches(response.data)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        toast.error('Failed to load matches')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [user?.id])

  if (isLoading) return <LoadingState />

  const mutualMatches = matches.filter(m => m.mutual)

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1350px]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          
          <h1 className="text-3xl font-bold text-white" style={mPlus1p.style}>
            Matches & Likes
          </h1>
        </div>
        <p className="text-neutral-400">
          Connect with people who liked you back
        </p>
      </motion.div>

      {/* Mutual Matches Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        {mutualMatches.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16 bg-gradient-to-br from-neutral-900/50 to-neutral-950/50 rounded-2xl border border-neutral-800/50 backdrop-blur-sm"
          >
            <div className="mb-4 inline-flex p-4 rounded-full bg-neutral-800/50">
              <Users className="h-12 w-12 text-neutral-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2" style={mPlus1p.style}>
              No mutual matches yet
            </h3>
            <p className="text-neutral-400 max-w-md mx-auto">
              Keep swiping! When someone likes you back, they&apos;ll appear here
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {mutualMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="group bg-gradient-to-br from-neutral-900 to-neutral-950 border-blue-800/30 cursor-pointer hover:border-blue-800/40 transition-all duration-200 overflow-hidden"
                  onClick={() => {
                    setSelectedProfile(match.profile)
                    setDialogOpen(true)
                  }}
                >
                  {/* Avatar and Name Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {match.profile.avatarUrl ? (
                          <Image
                            src={match.profile.avatarUrl}
                            alt={match.profile.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500/30"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border-2 border-blue-500/30 flex items-center justify-center">
                            <span className="text-blue-400 font-bold text-xl" style={mPlus1p.style}>
                              {match.profile.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-neutral-900">
                          <Heart className="h-3 w-3 text-white fill-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate" style={mPlus1p.style}>
                          {match.profile.name}
                        </h3>
                        <div className="flex items-center text-sm text-neutral-400 mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{match.profile.location}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    {/* Role and Experience */}
                    <div className="flex items-center text-sm text-neutral-300 bg-neutral-800/50 rounded-lg px-3 py-2.5 border border-neutral-700/50">
                      <Briefcase className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
                      <span className="truncate">
                        {match.profile.currentRole} • {match.profile.yearsExperience}+ yrs
                      </span>
                    </div>
                    
                    {/* Skills */}
                    {match.profile.skills && match.profile.skills.length > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {match.profile.skills.slice(0, 3).map((skill: string) => (
                            <Badge 
                              key={skill} 
                              variant="secondary" 
                              className="text-xs bg-blue-900/40 text-blue-400 border border-blue-500/30 hover:bg-blue-900/60 transition-colors"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {match.profile.skills.length > 3 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs text-neutral-400 border-neutral-600"
                            >
                              +{match.profile.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action hint */}
                    <div className="flex items-center justify-center text-xs text-neutral-500 pt-2 border-t border-neutral-800/50">
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                      <span>Click to view full profile</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <ProfileDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={selectedProfile}
      />
    </div>
  )
}