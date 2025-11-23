'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Briefcase, Users, MessageCircle, Mail, Linkedin, Twitter, Calendar, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import LoadingState from '@/components/ui/loading-state'
import ProfileDialog from '@/components/ui/profile-dialog'
import { M_PLUS_1p } from 'next/font/google'
import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

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

  type ContactInfo = {
    email?: string
    twitterUrl?: string
    linkedinUrl?: string
    scheduleUrl?: string
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
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [selectedContactInfo, setSelectedContactInfo] = useState<ContactInfo | null>(null)
  const [contactLoading, setContactLoading] = useState(false)

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

  const handleViewContactInfo = async (profileId: string, profileName: string) => {
    setContactLoading(true)
    try {
      const response = await axios.get(`/api/user/${profileId}/contactInfo`)
      setSelectedContactInfo(response.data.contactInfo)
      setContactDialogOpen(true)
    } catch (error) {
      toast.error(`Failed to load contact info for ${profileName}`)
      console.error(error)
    } finally {
      setContactLoading(false)
    }
  }

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
            Matches
          </h1>
        </div>
        <p className="text-neutral-400">
          Connect with people who matched with you
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
                >
                  {/* Avatar and Name Header */}
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="relative"
                        onClick={() => {
                          setSelectedProfile(match.profile)
                          setDialogOpen(true)
                        }}
                      >
                        {match.profile.avatarUrl ? (
                          <Image
                            src={match.profile.avatarUrl}
                            alt={match.profile.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500/30 hover:border-blue-500/60 transition-colors"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border-2 border-blue-500/30 flex items-center justify-center hover:border-blue-500/60 transition-colors">
                            <span className="text-blue-400 font-bold text-xl" style={mPlus1p.style}>
                              {match.profile.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-neutral-900">
                          <Heart className="h-3 w-3 text-white fill-white" />
                        </div>
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          setSelectedProfile(match.profile)
                          setDialogOpen(true)
                        }}
                      >
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-neutral-800/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-neutral-600 text-neutral-300 hover:bg-neutral-800"
                        onClick={() => {
                          setSelectedProfile(match.profile)
                          setDialogOpen(true)
                        }}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1" />
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs border-blue-600/50 text-blue-400 hover:bg-blue-900/20"
                        onClick={() => handleViewContactInfo(match.profile.id, match.profile.name)}
                        disabled={contactLoading}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Contact Info Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="bg-neutral-950 border-neutral-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white" style={mPlus1p.style}>
              Contact Information
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Reach out to your match
            </DialogDescription>
          </DialogHeader>

          {selectedContactInfo ? (
            <div className="space-y-4">
              {/* Email */}
              {selectedContactInfo.email && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-400">Email</p>
                    <a 
                      href={`mailto:${selectedContactInfo.email}`}
                      className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors"
                    >
                      {selectedContactInfo.email}
                    </a>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-600" />
                </motion.div>
              )}

              {/* LinkedIn */}
              {selectedContactInfo.linkedinUrl && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <Linkedin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-400">LinkedIn</p>
                    <a 
                      href={selectedContactInfo.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors"
                    >
                      View Profile
                    </a>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-600" />
                </motion.div>
              )}

              {/* Twitter */}
              {selectedContactInfo.twitterUrl && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <Twitter className="h-5 w-5 text-sky-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-400">Twitter</p>
                    <a 
                      href={selectedContactInfo.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors"
                    >
                      View Profile
                    </a>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-600" />
                </motion.div>
              )}

              {/* Schedule */}
              {selectedContactInfo.scheduleUrl && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-400">Schedule</p>
                    <a 
                      href={selectedContactInfo.scheduleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate transition-colors"
                    >
                      Book a Meeting
                    </a>
                  </div>
                  <ExternalLink className="h-4 w-4 text-neutral-600" />
                </motion.div>
              )}

              {/* No Contact Info */}
              {!selectedContactInfo.email && 
               !selectedContactInfo.linkedinUrl && 
               !selectedContactInfo.twitterUrl && 
               !selectedContactInfo.scheduleUrl && (
                <div className="text-center py-6">
                  <Mail className="h-8 w-8 text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">No contact information available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <LoadingState />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ProfileDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={selectedProfile}
      />
    </div>
  )
}