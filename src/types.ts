export type WorkingStyle = 'ASYNC' | 'REAL_TIME' | 'FLEXIBLE' | 'STRUCTURED'
export type CollaborationPref = 'REMOTE' | 'HYBRID' | 'IN_PERSON' | 'DOESNT_MATTER'
export type StartupStage = 'IDEA' | 'MVP' | 'SCALING' | 'EXITED'
export type CommitmentLevel = 'EXPLORING' | 'BUILDING' | 'LAUNCHING' | 'FULL_TIME_READY'

export type Project = {
  id: string
  name: string
  description: string
  link?: string
}

export type StartupInfo = {
  startupStage: StartupStage
  startupGoals: string
  startupCommitment: CommitmentLevel
  lookingFor: string[]
}

export type ContactInfo = {
  id: string
  userId: string
  email?: string
  twitterUrl?: string
  linkedinUrl?: string
  scheduleUrl?: string
}

export type User = {
  id: string
  name: string
  avatarUrl?: string
  location: string
  description?: string
  personalityTags: string[]
  workingStyle: WorkingStyle
  collaborationPref: CollaborationPref
  currentRole: string
  yearsExperience: number
  domainExpertise: string[]
  skills: string[]
  rolesOpenTo: string[]
  pastProjects: Project[]
  startupInfo?: StartupInfo
  contactInfo?: ContactInfo
  socialLinks?: { platform: string, url: string }[]
}

export type FilterOptions = {
  skills: string[]
  domains: string[]
  workingStyles: WorkingStyle[]
  collaborationPrefs: CollaborationPref[]
  experienceRange: [number, number]
  startupStages?: StartupStage[]
  location?: string
  maxDistance?: number
  enableLocationBasedMatching: boolean
  preferencesFromProfile: boolean
  userCoordinates?: {  // Changed from coordinates to userCoordinates
    latitude: number;
    longitude: number;
    geohash: string;
  } | null;
}

export type ProfileCardProps = {
  activeUser: User | null
  x: any
  rotate: any
  opacity: any
  likeOpacity: any
  nopeOpacity: any
  handleLike: () => void
  handlePass: () => void
}