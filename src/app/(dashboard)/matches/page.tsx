'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import axios from 'axios'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, MapPin, Briefcase, Users } from 'lucide-react'
import { toast } from 'sonner'
import LoadingState from '@/components/ui/loading-state'
import ProfileDialog from '@/components/ui/profile-dialog'

export default function MatchesPage() {
  const { user } = useUser()
  const [matches, setMatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    const fetchMatches = async () => {
      if (!user?.id) return
      
      try {
        const response = await axios.get(`/api/matches/${user.id}`)
        setMatches(response.data)
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
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-red-400" />
        <h1 className="text-2xl font-bold text-white">Matches & Likes</h1>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Mutual Matches</h2>
          <Badge variant="secondary" className="bg-green-900/40 text-green-400">
            {mutualMatches.length}
          </Badge>
        </div>

        {mutualMatches.length === 0 ? (
          <div className="text-center py-8 bg-neutral-900/50 rounded-lg border border-neutral-800">
            <Users className="h-12 w-12 text-neutral-600 mx-auto mb-2" />
            <p className="text-neutral-400">No mutual matches yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mutualMatches.map((match) => (
              <Card 
                key={match.id} 
                className="bg-neutral-900 border-green-800/30 cursor-pointer hover:border-green-600/50 transition-colors"
                onClick={() => {
                  setSelectedProfile(match.profile)
                  setDialogOpen(true)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {match.profile.avatarUrl ? (
                      <img
                        src={match.profile.avatarUrl}
                        alt={match.profile.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-green-400 font-semibold">
                          {match.profile.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{match.profile.name}</h3>
                      <div className="flex items-center text-sm text-neutral-400">
                        <MapPin className="h-3 w-3 mr-1" />
                        {match.profile.location}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center text-sm text-neutral-400 mb-3">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {match.profile.currentRole} • {match.profile.yearsExperience}+ yrs
                  </div>
                  
                  {match.profile.skills && match.profile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.profile.skills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs bg-green-900/40 text-green-400">
                          {skill}
                        </Badge>
                      ))}
                      {match.profile.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs text-neutral-400">
                          +{match.profile.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProfileDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        profile={selectedProfile}
      />
    </div>
  )
}