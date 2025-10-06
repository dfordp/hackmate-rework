'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Briefcase, Clock, Users, ExternalLink, AlertCircle, Mail } from 'lucide-react'
import { WORKING_STYLE_LABELS, COLLABORATION_PREF_LABELS, STARTUP_STAGE_LABELS, COMMITMENT_LEVEL_LABELS } from '@/constants'

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: any
}

export default function ProfileDialog({ open, onOpenChange, profile }: ProfileDialogProps) {
  if (!profile) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold text-xl">
                  {profile.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <DialogTitle className="text-xl text-white">{profile.name}</DialogTitle>
              <div className="flex items-center text-neutral-400 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {profile.location}
              </div>
              <div className="flex items-center text-neutral-400 mt-1">
                <Briefcase className="h-4 w-4 mr-1" />
                {profile.currentRole} • {profile.yearsExperience}+ yrs
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-neutral-800">
            <TabsTrigger value="about" className="text-white/85 data-[state=active]:bg-blue-500/40">
              About
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-white/85 data-[state=active]:bg-blue-500/40">
              Skills
            </TabsTrigger>
            <TabsTrigger value="startup" className="text-white/85 data-[state=active]:bg-blue-500/40">
              Startup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            {profile.description && (
              <div>
                <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
                  {profile.description}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-400 flex items-center mb-1">
                  <Clock className="h-3 w-3 mr-1" />Working Style
                </span>
                <span className="text-sm font-medium text-white">
                  {WORKING_STYLE_LABELS[profile.workingStyle as keyof typeof WORKING_STYLE_LABELS] || profile.workingStyle}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-400 flex items-center mb-1">
                  <Users className="h-3 w-3 mr-1" />Collaboration
                </span>
                <span className="text-sm font-medium text-white">
                  {COLLABORATION_PREF_LABELS[profile.collaborationPref as keyof typeof COLLABORATION_PREF_LABELS] || profile.collaborationPref}
                </span>
              </div>
            </div>

            {profile.personalityTags && profile.personalityTags.length > 0 && (
              <div>
                <span className="text-xs text-neutral-400 mb-2 block font-semibold">Personality</span>
                <div className="flex flex-wrap gap-2">
                  {profile.personalityTags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="border-blue-500/40 text-blue-400 bg-neutral-950/70">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.contactInfo?.email && (
              <div>
                <span className="text-xs text-neutral-400 mb-2 block font-semibold">Contact</span>
                <a 
                  href={`mailto:${profile.contactInfo.email}`}
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {profile.contactInfo.email}
                </a>
              </div>
            )}

            {profile.pastProjects && profile.pastProjects.length > 0 && (
              <div>
                <span className="text-xs text-neutral-400 mb-2 block font-semibold">Past Projects</span>
                <div className="space-y-3">
                  {profile.pastProjects.map((project: any) => (
                    <div key={project.id} className="border border-neutral-800 rounded-lg p-3">
                      <h4 className="font-semibold text-white">{project.name}</h4>
                      <p className="text-neutral-300 text-sm mt-1">{project.description}</p>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-sm text-blue-400 mt-2 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="skills" className="mt-4 space-y-4">
            {profile.skills && profile.skills.length > 0 && (
              <div>
                <span className="text-xs text-neutral-400 mb-2 block font-semibold">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge key={skill} className="bg-blue-600/40 text-white/90">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.domainExpertise && profile.domainExpertise.length > 0 && (
              <div>
                <span className="text-xs text-neutral-400 mb-2 block font-semibold">Domain Expertise</span>
                <div className="flex flex-wrap gap-2">
                  {profile.domainExpertise.map((domain: string) => (
                    <Badge key={domain} variant="outline" className="border-blue-400/40 text-blue-300 bg-neutral-950/70">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="startup" className="mt-4 space-y-4">
            {profile.startupInfo ? (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-blue-900/40 border-blue-400/30 text-blue-400">
                    {STARTUP_STAGE_LABELS[profile.startupInfo.startupStage as keyof typeof STARTUP_STAGE_LABELS] || profile.startupInfo.startupStage}
                  </Badge>
                  <Badge variant="outline" className="border-blue-400/40 text-blue-400">
                    {COMMITMENT_LEVEL_LABELS[profile.startupInfo.startupCommitment as keyof typeof COMMITMENT_LEVEL_LABELS] || profile.startupInfo.startupCommitment}
                  </Badge>
                </div>
                
                <div>
                  <span className="text-xs text-neutral-400 mb-2 block font-semibold">Startup Goals</span>
                  <p className="text-neutral-300 leading-relaxed whitespace-pre-line">
                    {profile.startupInfo.startupGoals}
                  </p>
                </div>

                {profile.startupInfo.lookingFor && profile.startupInfo.lookingFor.length > 0 && (
                  <div>
                    <span className="text-xs text-neutral-400 mb-2 block font-semibold">Looking For</span>
                    <div className="flex flex-wrap gap-2">
                      {profile.startupInfo.lookingFor.map((role: string) => (
                        <Badge key={role} className="bg-blue-950 text-blue-400">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-neutral-600 mb-2" />
                <p className="text-neutral-600">No startup info provided.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}