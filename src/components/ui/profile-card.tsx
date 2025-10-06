//@ts-nocheck
'use client'

import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  MapPin,
  Heart,
  X,
  Briefcase,
  Clock,
  Users,
  ExternalLink,
  AlertCircle,
} from "lucide-react"
import { M_PLUS_1p } from "next/font/google"
import { 
  WORKING_STYLE_LABELS,
  COLLABORATION_PREF_LABELS,
  STARTUP_STAGE_LABELS,
  COMMITMENT_LEVEL_LABELS,
} from '../../constants'

const mPlus1p = M_PLUS_1p({
  subsets: ['latin'],
  weight: ['500', '700']
})

export default function ProfileCard({
  activeUser,
  x,
  rotate,
  opacity,
  likeOpacity,
  nopeOpacity,
  handleLike,
  handlePass,
}: ProfileCardProps) {
  if (!activeUser) return null

  return (
    <div className="relative w-full h-auto select-none">
      <motion.div
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) handleLike()
          else if (info.offset.x < -100) handlePass()
          else x.set(0)
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* LIKE / NOPE indicators */}
        <motion.div
          className="absolute top-10 right-10 rotate-12 border-4 border-green-500 bg-neutral-900 rounded-md px-6 py-2 z-10 shadow-lg"
          style={{ opacity: likeOpacity }}
        >
          <span className="font-extrabold text-3xl text-green-400">LIKE</span>
        </motion.div>
        <motion.div
          className="absolute top-10 left-10 -rotate-12 border-4 border-red-500 bg-neutral-900 rounded-md px-6 py-2 z-10 shadow-lg"
          style={{ opacity: nopeOpacity }}
        >
          <span className="font-extrabold text-3xl text-red-400">NOPE</span>
        </motion.div>

        <Card className="overflow-hidden max-w-xl mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
          {/* Card Banner */}
          <div className="relative h-56 sm:h-72 bg-neutral-950">
            {activeUser.avatarUrl ? (
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-900/50 to-indigo-900/30">
                <div className="text-6xl font-bold text-blue-400">
                  {activeUser.name.charAt(0)}
                </div>
              </div>
            )}
            {/* gradient overlay for white text */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-2xl font-bold text-white/90" style={mPlus1p.style}>
                {activeUser.name}
              </h2>
              <div className="flex items-center mt-1 text-sm text-blue-300 font-medium">
                <MapPin className="h-4 w-4 mr-1" />
                {activeUser.location}
              </div>
              <div className="flex items-center mt-1 text-sm text-neutral-400">
                <Briefcase className="h-4 w-4 mr-1" />
                <span className="">{activeUser.currentRole}</span>
                {typeof activeUser.yearsExperience === "number" && (
                  <>
                    <span className="mx-1 text-white/15">•</span>
                    <span>{activeUser.yearsExperience}+ yrs</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <CardContent className="p-6 pb-2 bg-neutral-900 text-white/90">
            <Tabs defaultValue="about">
              <TabsList className="grid w-full grid-cols-3 mb-4 bg-neutral-800 rounded-lg shadow">
                <TabsTrigger value="about" className="text-white/85 data-[state=active]:bg-blue-500/40 data-[state=active]:text-white font-semibold rounded-md transition-all">
                  About
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-white/85 data-[state=active]:bg-blue-500/40 data-[state=active]:text-white font-semibold rounded-md transition-all">
                  Skills
                </TabsTrigger>
                <TabsTrigger value="startup" className="text-white/85 data-[state=active]:bg-blue-500/40 data-[state=active]:text-white font-semibold rounded-md transition-all">
                  Startup
                </TabsTrigger>
              </TabsList>

              {/* ABOUT TAB */}
              <TabsContent value="about" className="mt-4 space-y-5 max-h-[260px] overflow-y-auto pr-2">
                {activeUser.description &&
                  <p className="text-neutral-300 leading-relaxed text-sm font-medium whitespace-pre-line break-words">{activeUser.description}</p>
                }
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-neutral-400 flex items-center mb-1">
                      <Clock className="h-3 w-3 mr-1" />Working Style
                    </span>
                    <span className="text-sm font-medium break-words">
                      {WORKING_STYLE_LABELS[activeUser.workingStyle]}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 flex items-center mb-1">
                      <Users className="h-3 w-3 mr-1" />Collaboration
                    </span>
                    <span className="text-sm font-medium">
                      {COLLABORATION_PREF_LABELS[activeUser.collaborationPref]}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 mb-1 block font-semibold">Personality</span>
                  <div className="flex flex-wrap gap-1">
                    {activeUser.personalityTags?.length > 0
                      ? activeUser.personalityTags.map(tag => (
                          <Badge key={tag} variant="outline" className="border-blue-500/40 text-blue-400 text-xs bg-neutral-950/70">
                            {tag}
                          </Badge>
                        ))
                      : <p className="text-sm text-neutral-400">No personality tags provided</p>}
                  </div>
                </div>
                {activeUser.pastProjects && activeUser.pastProjects.length > 0 && (
                  <div>
                    <span className="text-xs text-neutral-400 mb-1 block font-semibold">Past Projects</span>
                    <div className="space-y-2">
                      {activeUser.pastProjects.map(project => (
                        <div key={project.id || project.name} className="text-sm">
                          <span className="font-semibold text-white/85">{project.name}</span>
                          <p className="text-neutral-300 text-xs">{project.description}</p>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-xs text-blue-400 mt-1 hover:underline"
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

              {/* SKILLS TAB */}
              <TabsContent value="skills" className="mt-4 space-y-4 max-h-[260px] overflow-y-auto pr-2">
                <div>
                  <span className="text-xs text-neutral-400 mb-1 block font-semibold">Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {activeUser.skills?.length > 0
                      ? activeUser.skills.map(skill => (
                          <Badge key={skill} variant="default" className="bg-blue-600/40 text-white/90 text-xs font-semibold">
                            {skill}
                          </Badge>
                        ))
                      : <p className="text-sm text-neutral-400">No skills provided</p>}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 mb-1 block font-semibold">Domains</span>
                  <div className="flex flex-wrap gap-1">
                    {activeUser.domainExpertise?.length > 0
                      ? activeUser.domainExpertise.map(domain => (
                          <Badge key={domain} variant="outline" className="border-blue-400/40 text-blue-300 text-xs bg-neutral-950/70">
                            {domain}
                          </Badge>
                        ))
                      : <p className="text-sm text-neutral-400">No domains provided</p>}
                  </div>
                </div>
                {activeUser.rolesOpenTo && (
                  <div>
                    <span className="text-xs text-neutral-400 mb-1 block font-semibold">Open to Roles</span>
                    <div className="flex flex-wrap gap-1">
                      {activeUser.rolesOpenTo.map(role => (
                        <Badge key={role} variant="outline" className="text-xs border-white/20 text-white/70">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* STARTUP TAB */}
              <TabsContent value="startup" className="mt-4 space-y-4 max-h-[260px] overflow-y-auto pr-2">
                {activeUser.startupInfo ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-1">
                      <Badge variant="secondary" className="bg-blue-900/40 border-blue-400/30 text-blue-400 font-semibold">{STARTUP_STAGE_LABELS[activeUser.startupInfo.startupStage]}</Badge>
                      <Badge variant="outline" className="border-blue-400/40 text-blue-400">{COMMITMENT_LEVEL_LABELS[activeUser.startupInfo.startupCommitment]}</Badge>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-400 mb-1 block font-semibold">Startup Goals</span>
                      <p className="text-neutral-300 leading-relaxed text-sm font-medium whitespace-pre-line break-words">{activeUser.startupInfo.startupGoals}</p>
                    </div>
                    {activeUser.startupInfo.lookingFor && (
                      <div>
                        <span className="text-xs text-neutral-400 mb-1 block font-semibold">Looking For</span>
                        <div className="flex flex-wrap gap-1">
                          {activeUser.startupInfo.lookingFor.map(role => (
                            <Badge key={role} variant="secondary" className="bg-blue-950 text-blue-400 text-xs">{role}</Badge>
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
          </CardContent>

          {/* Card Footer (buttons) */}
          <CardFooter className="flex justify-center gap-4 bg-neutral-900 pb-6 pt-2">
            <Button
              size="icon"
              variant="outline"
              className="h-14 w-14 rounded-full bg-neutral-950 border-red-300/30 text-red-400 shadow-md hover:bg-red-900/30 hover:text-red-400 hover:border-red-400"
              onClick={handlePass}
            >
              <X className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full bg-blue-500/40 text-white/90 font-bold shadow-md hover:bg-green-600 transition-colors"
              onClick={handleLike}
            >
              <Heart className="h-6 w-6" />
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
