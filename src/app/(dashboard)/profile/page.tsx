'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from "@clerk/nextjs"
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, Loader2 } from 'lucide-react'
import { M_PLUS_1p } from 'next/font/google'

// Google font import for matching headers
const mPlus1p = M_PLUS_1p({
  subsets: ['latin'],
  weight: ['500', '700']
})

type Project = {
  id: string
  name: string
  description: string
  link?: string
}

type ContactInfo = {
  email?: string
  twitterUrl?: string
  linkedinUrl?: string
  scheduleUrl?: string
}

type User = {
  id: string
  name: string
  description: string
  avatarUrl?: string
  location: string
  personalityTags: string[]
  workingStyle: 'ASYNC' | 'REAL_TIME' | 'FLEXIBLE' | 'STRUCTURED'
  collaborationPref: 'REMOTE' | 'HYBRID' | 'IN_PERSON' | 'DOESNT_MATTER'
  currentRole: string
  yearsExperience: number
  domainExpertise: string[]
  skills: string[]
  rolesOpenTo?: string[]
  pastProjects?: Project[]
  startupInfo?: {
    startupStage: 'IDEA' | 'MVP' | 'SCALING' | 'EXITED'
    startupGoals: string
    startupCommitment: 'EXPLORING' | 'BUILDING' | 'LAUNCHING' | 'FULL_TIME_READY'
    lookingFor: string[]
  }
  contactInfo?: ContactInfo
}

export default function Profile() {
  const router = useRouter()
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    if (clerkLoaded && isSignedIn && clerkUser) {
      fetchUserData(clerkUser.id)
    } else if (clerkLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [clerkLoaded, isSignedIn, clerkUser, router])

  const fetchUserData = async (userId: string) => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/user/${userId}`)
      setUser(response.data)
      setError(null)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        router.push('/onboarding')
      } else {
        toast.error('Error fetching user data')
        setError('Failed to load profile data')
      }
      console.error('Error fetching user data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !clerkLoaded) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500/40" />
          <p className="text-white/80 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-950">
        <Card className="max-w-lg w-full bg-neutral-900 border-gray-800 rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-white/85">{error}</p>
            <div className="flex justify-center mt-4">
              <Button variant="secondary" onClick={() => fetchUserData(clerkUser!.id)}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-neutral-950">
        <Card className="max-w-lg w-full bg-neutral-900 border-gray-800 rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-white/80">Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-neutral-400">You have not completed your profile yet.</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => router.push('/onboarding')} className="bg-blue-500/40">
                Complete Your Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-2 sm:px-0 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl tracking-tight text-white/90 font-bold" style={mPlus1p.style}>
            Profile
          </h1>
          <Button
            onClick={() => router.push('/profile/edit')}
            variant="outline"
            className="flex items-center gap-2 border-gray-700 text-white/85 hover:bg-blue-500/10 transition-all"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/main column */}
          <div className="lg:col-span-2 space-y-7">
            <Card className="bg-neutral-900 border-gray-800 rounded-2xl shadow-lg">
              <CardHeader className="flex flex-row items-center gap-5 pb-2">
                <Avatar className="h-20 w-20 border-4 border-blue-500/20 shadow">
                  <AvatarImage src={user.avatarUrl || ''} />
                  <AvatarFallback className="bg-blue-500/40 text-white font-bold">{user.name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-white/90" style={mPlus1p.style}>
                    {user.name}
                  </CardTitle>
                  <CardDescription className="text-blue-300 font-medium">{user.location}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default">{user.currentRole}</Badge>
                    <Badge variant="outline">{user.yearsExperience}+ years</Badge>
                  </div>
                </div>
              </CardHeader>
              {/* About */}
              {user.description && (
                <div className="px-6 border-t border-gray-800 pt-4 pb-3 mt-1">
                  <h3 className="font-semibold text-white/85 mb-1">About</h3>
                  <p className="text-neutral-300 text-sm break-words whitespace-pre-wrap">{user.description}</p>
                </div>
              )}

              <CardContent className="space-y-4 pt-3">
                {user.personalityTags?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white/85 mb-1">Personality Traits</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.personalityTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-blue-400/30 text-blue-400 bg-transparent"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {user.skills?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white/85 mb-1">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-blue-400/30 text-blue-400 bg-transparent"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Domain */}
                {user.domainExpertise?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white/85 mb-1">Domain Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.domainExpertise.map((domain) => (
                        <Badge
                          key={domain}
                          variant="outline"
                          className="border-blue-400/30 text-blue-400 bg-transparent"
                        >
                          {domain}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {user.contactInfo && (
                  <div>
                    <h3 className="font-semibold text-white/85 mb-1">Contact</h3>
                    <div className="space-y-1 text-white/70 text-sm">
                      {user.contactInfo.email && (
                        <p>
                          <span className="font-medium text-white/85">Email: </span>
                          <a href={`mailto:${user.contactInfo.email}`} className="text-blue-500 hover:underline">
                            {user.contactInfo.email}
                          </a>
                        </p>
                      )}
                      {user.contactInfo.linkedinUrl && (
                        <p>
                          <span className="font-medium text-white/85">LinkedIn: </span>
                          <a href={user.contactInfo.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {user.contactInfo.linkedinUrl}
                          </a>
                        </p>
                      )}
                      {user.contactInfo.twitterUrl && (
                        <p>
                          <span className="font-medium text-white/85">Twitter: </span>
                          <a href={user.contactInfo.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {user.contactInfo.twitterUrl}
                          </a>
                        </p>
                      )}
                      {user.contactInfo.scheduleUrl && (
                        <p>
                          <span className="font-medium text-white/85">Schedule: </span>
                          <a href={user.contactInfo.scheduleUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {user.contactInfo.scheduleUrl}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Projects */}
            {user.pastProjects && user.pastProjects.length > 0 && (
              <Card className="bg-neutral-900 border-gray-800 rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white/90" style={mPlus1p.style}>Past Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.pastProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-lg border border-gray-800 hover:bg-blue-500/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedProject(project)}
                    >
                      <h3 className="font-semibold text-white/85">{project.name}</h3>
                      <p className="text-neutral-400 text-xs mt-1">
                        {project.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (right column) */}
          <div className="space-y-7">
            <Card className="bg-neutral-900 border-gray-800 rounded-2xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-white/90" style={mPlus1p.style}>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-neutral-400">Working Style</h3>
                  <p className="mt-1 text-white/85 text-sm capitalize">
                    {user.workingStyle.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-neutral-400">Collaboration</h3>
                  <p className="mt-1 text-white/85 text-sm capitalize">
                    {user.collaborationPref === 'DOESNT_MATTER'
                      ? "Doesn't Matter"
                      : user.collaborationPref.replace('_', ' ').toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {user.startupInfo && (
              <Card className="bg-neutral-900 border-gray-800 rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white/90" style={mPlus1p.style}>Startup Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400">Stage</h3>
                    <Badge variant="outline" className="mt-1 border-blue-500/40 font-semibold text-blue-400">{user.startupInfo.startupStage}</Badge>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400">Commitment</h3>
                    <Badge variant="outline" className="mt-1 border-blue-500/40 font-semibold text-blue-400">
                      {user.startupInfo?.startupCommitment
                        .split('_')
                        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                        .join(' ')}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-neutral-400">Looking For</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.startupInfo.lookingFor.map((role) => (
                        <Badge key={role} variant="outline"
                        className="border-blue-400/30 text-blue-400 bg-transparent">{role}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Project Modal Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-500 mb-2">{selectedProject?.name}</DialogTitle>
            <DialogDescription className="text-white/80">{selectedProject?.description}</DialogDescription>
          </DialogHeader>
          {selectedProject?.link && (
            <div className="mt-4">
              <Button variant="outline" asChild className="hover:bg-blue-500/10 text-blue-500 border-blue-500/50">
                <a href={selectedProject.link} target="_blank" rel="noopener noreferrer">
                  View Project
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
