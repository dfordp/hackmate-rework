'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm, UseFormReturn, FieldArrayWithId } from "react-hook-form"
import * as z from "zod"
import axios from "axios"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Plus, ChevronRight, ChevronLeft } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { CloudinaryError, uploadOnCloudinary } from '@/lib/cloudinary'
import { M_PLUS_1p } from "next/font/google"
import Image from "next/image"
import { extractFormSubmitErrorMessages } from "@/lib/utils"

const mPlus1p = M_PLUS_1p({
  subsets: ['latin'],
  weight: ['100', '300', '400', '500', '700']
})

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  avatar: z
    .custom<FileList>()
    .refine((files) => !files || files.length === 0 || files.length === 1, "Only one image is allowed")
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      "Max file size is 5MB"
    )
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      "Only .jpg, .jpeg, .png and .webp formats are supported"
    )
    .optional(),
  description: z.string().min(50, { message: "Tell us a bit more about yourself (min 50 characters)" }),
  location: z.string().min(1, { message: "Location is required" }),
  currentRole: z.string().min(1, { message: "Current role is required" }),
  yearsExperience: z.number().min(0),
  workingStyle: z.enum(['ASYNC', 'REAL_TIME', 'FLEXIBLE', 'STRUCTURED']),
  collaborationPref: z.enum(['REMOTE', 'HYBRID', 'IN_PERSON', 'DOESNT_MATTER']),
  personalityTags: z.array(z.string()).min(1, { message: "Select at least one personality trait" }),
  domainExpertise: z.array(z.string()).min(1, { message: "Select at least one domain" }),
  skills: z.array(z.string()).min(1, { message: "Select at least one skill" }),
  pastProjects: z.array(z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().min(1, "Project description is required"),
    link: z.string().url().optional().or(z.literal('')),
  })).optional(),
  startupInfo: z.object({
    stage: z.enum(['IDEA', 'MVP', 'SCALING', 'EXITED']).optional(),
    goals: z.string().min(50, "Please describe your startup goals in detail").optional(),
    commitment: z.enum(['EXPLORING', 'BUILDING', 'LAUNCHING', 'FULL_TIME_READY']).optional(),
    lookingFor: z.array(z.string()).optional(),
  }).optional(),
  contactInfo: z.object({
    email: z.string().email("Please enter a valid email").optional(),
    twitterUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
    linkedinUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
    scheduleUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  }).optional(),
})

type FormValues = z.infer<typeof formSchema>

const personalityOptions = [
  "Problem Solver", "Creative", "Team Player", "Leader",
  "Detail-Oriented", "Fast Learner", "Self-Motivated",
  "Strategic Thinker", "Innovative", "Analytical"
]

const skillOptions = [
  "Frontend Development", "Backend Development", "Full Stack Development",
  "Mobile Development", "UI/UX Design", "Product Management",
  "Business Development", "Sales", "Marketing & Growth",
  "Finance & Accounting", "Fundraising", "Operations & Management",
  "Data Science", "Machine Learning / AI", "Cloud & DevOps",
  "Cybersecurity", "Hardware Engineering", "Research & Analysis",
  "Legal & Compliance", "People & HR"
]

const domainOptions = [
  "Software Development", "Product & Design", "Business & Strategy",
  "Growth & Marketing", "Finance & Legal", "Sales & Partnerships",
  "Data & AI", "Hardware & Engineering", "Research & Innovation",
  "People & Culture"
]

const STEPS = [
  { id: 1, title: "Basic Info", description: "Your name and location" },
  { id: 2, title: "About You", description: "Profile picture and description" },
  { id: 3, title: "Preferences", description: "Working style & collaboration" },
  { id: 4, title: "Skills & Traits", description: "Your expertise and personality" },
  { id: 5, title: "Contact Info", description: "How to reach you" },
  { id: 6, title: "Projects", description: "Your past projects" },
  { id: 7, title: "Startup Info", description: "Your startup goals" },
]

export default function OnboardingForm() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const userId = user?.id
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const email = typeof user?.primaryEmailAddress === "string"
    ? user.primaryEmailAddress
    : user?.primaryEmailAddress?.emailAddress ?? ""

  useEffect(() => {
    if (userId) {
      const checkUserProfile = async () => {
        try {
          const response = await axios.get(`/api/user/${userId}`)
          if (response.data) {
            router.push('/explore')
          }
        } catch {
          // Continue onboarding if 404
        } finally {
          setIsLoading(false)
        }
      }
      checkUserProfile()
    } else {
      setIsLoading(false)
    }
  }, [userId, router])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      currentRole: "",
      yearsExperience: 0,
      workingStyle: "FLEXIBLE",
      collaborationPref: "DOESNT_MATTER",
      personalityTags: [],
      domainExpertise: [],
      skills: [],
      pastProjects: [],
      contactInfo: {
        email: email,
        twitterUrl: "",
        linkedinUrl: "",
        scheduleUrl: ""
      },
      startupInfo: {
        stage: undefined,
        goals: "",
        commitment: undefined,
        lookingFor: []
      }
    },
    mode: "onBlur"
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pastProjects",
  })

  const handleNext = async () => {
    const stepFields = getStepFields(step)
    const isValid = await form.trigger(stepFields as (keyof FormValues)[])
    if (isValid) {
      setStep(Math.min(STEPS.length, step + 1))
    }
  }

  const getStepFields = (stepNum: number): string[] => {
    const fieldMap: { [key: number]: string[] } = {
      1: ['name', 'location'],
      2: ['description', 'avatar'],
      3: ['currentRole', 'yearsExperience', 'workingStyle', 'collaborationPref'],
      4: ['personalityTags', 'domainExpertise', 'skills'],
      5: ['contactInfo.email'],
      6: ['pastProjects'],
      7: ['startupInfo.stage', 'startupInfo.goals', 'startupInfo.commitment'],
    }
    return fieldMap[stepNum] || []
  }

  const onError = (formErrors: typeof form.formState.errors) => {
    extractFormSubmitErrorMessages(formErrors).forEach(msg => toast.warning(msg))
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      let avatarUrl: string | undefined
      if (values.avatar?.[0]) {
        const uploadResult = await uploadOnCloudinary(values.avatar[0])
        avatarUrl = uploadResult.secure_url
      }

      const userData = {
        id: userId,
        name: values.name,
        description: values.description,
        location: values.location,
        personalityTags: values.personalityTags,
        workingStyle: values.workingStyle,
        collaborationPref: values.collaborationPref,
        currentRole: values.currentRole,
        yearsExperience: values.yearsExperience,
        domainExpertise: values.domainExpertise || [],
        skills: values.skills,
        pastProjects: values.pastProjects || [],
        startupInfo: values.startupInfo,
        contactInfo: values.contactInfo,
        avatarUrl: avatarUrl,
      }

      const formData = new FormData()
      formData.append('userData', JSON.stringify(userData))

      await axios.post('/api/user', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      if (values.avatar?.[0] && user) {
        try {
          await user.setProfileImage({ file: values.avatar[0] })
        } catch (clerkError) {
          console.error('Error updating Clerk profile image:', clerkError)
        }
      }

      toast.success('Profile created successfully')
      router.push('/explore')
    } catch (error) {
      let message = 'Unexpected error occurred.'
      if (error instanceof CloudinaryError) {
        message = error.message
      } else if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || error.response?.data?.message || error.message
      } else if (error instanceof Error) {
        message = error.message
      }
      toast.error(message)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-2 sm:px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>
              {STEPS[step - 1].title}
            </h1>
            <span className="text-sm text-gray-500 font-medium">{step}/{STEPS.length}</span>
          </div>
          <p className="text-gray-400 text-sm mb-6">{STEPS[step - 1].description}</p>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="bg-neutral-900 rounded-2xl border border-gray-800 p-8 space-y-8">

            {/* Step 1: Basic Info */}
            {step === 1 && <Step1Form form={form} />}

            {/* Step 2: About You */}
            {step === 2 && <Step2Form form={form} />}

            {/* Step 3: Preferences */}
            {step === 3 && <Step3Form form={form} />}

            {/* Step 4: Skills & Traits */}
            {step === 4 && <Step4Form form={form} personalityOptions={personalityOptions} domainOptions={domainOptions} skillOptions={skillOptions} />}

            {/* Step 5: Contact Info */}
            {step === 5 && <Step5Form form={form} />}

            {/* Step 6: Past Projects */}
            {step === 6 && <Step6Form form={form} fields={fields} append={append} remove={remove} />}

            {/* Step 7: Startup Info */}
            {step === 7 && <Step7Form form={form} skillOptions={skillOptions} />}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-4 pt-8 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="gap-2 px-6"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {step === STEPS.length ? (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? "Creating Profile..." : "Complete Profile"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

// Step Components
function Step1Form({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Full Name</FormLabel>
            <FormControl>
              <Input
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="John Doe"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Location</FormLabel>
            <FormControl>
              <Input
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="San Francisco, CA"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function Step2Form({ form }: { form: UseFormReturn<FormValues> }) {

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="avatar"
        render={({ field: { onChange, value, ...field } }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Profile Picture</FormLabel>
            <FormControl>
              <div className="flex items-center gap-6">
                {value && (
                  <div className="relative">
                    <Image
                      src={URL.createObjectURL(value[0])}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/40"
                      width={100}
                      height={100}
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={(e) => onChange(e.target.files)}
                  className="bg-neutral-950 border-gray-700 text-white/90 cursor-pointer flex-1"
                  {...field}
                />
              </div>
            </FormControl>
            <FormDescription>Max 5MB, JPEG, PNG or WebP</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">About You</FormLabel>
            <FormControl>
              <Textarea
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500 min-h-[140px] resize-none"
                placeholder="Tell us about yourself, your background, and what you're looking for..."
                {...field}
              />
            </FormControl>
            <FormDescription className="text-gray-500">Minimum 50 characters</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function Step3Form({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="currentRole"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Current Role</FormLabel>
            <FormControl>
              <Input
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="Software Engineer"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="yearsExperience"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Years of Experience</FormLabel>
            <FormControl>
              <Input
                type="number"
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="workingStyle"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Working Style</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-neutral-950 border-gray-700 text-white/90">
                  <SelectValue placeholder="Select working style" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-neutral-900 border-gray-700">
                <SelectItem value="ASYNC">Async</SelectItem>
                <SelectItem value="REAL_TIME">Real Time</SelectItem>
                <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                <SelectItem value="STRUCTURED">Structured</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="collaborationPref"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Collaboration Preference</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="bg-neutral-950 border-gray-700 text-white/90">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-neutral-900 border-gray-700">
                <SelectItem value="REMOTE">Remote</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="IN_PERSON">In Person</SelectItem>
                <SelectItem value="DOESNT_MATTER">Does not Matter</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function Step4Form({ form, personalityOptions, domainOptions, skillOptions }: { form: UseFormReturn<FormValues>; personalityOptions: string[]; domainOptions: string[]; skillOptions: string[] }) {
  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="personalityTags"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Personality Traits</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2 p-4 border border-gray-700 rounded-lg bg-neutral-950">
                {personalityOptions.map((tag) => (
                  <Badge
                    key={tag}
                    variant={field.value.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      field.value.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => {
                      const newValue = field.value.includes(tag)
                        ? field.value.filter((t: string) => t !== tag)
                        : [...field.value, tag]
                      field.onChange(newValue)
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="domainExpertise"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Domain Expertise</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2 p-4 border border-gray-700 rounded-lg bg-neutral-950">
                {domainOptions.map((tag) => (
                  <Badge
                    key={tag}
                    variant={field.value.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      field.value.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => {
                      const newValue = field.value.includes(tag)
                        ? field.value.filter((t: string) => t !== tag)
                        : [...field.value, tag]
                      field.onChange(newValue)
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="skills"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Skills</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2 p-4 border border-gray-700 rounded-lg bg-neutral-950 max-h-56 overflow-y-auto">
                {skillOptions.map((tag) => (
                  <Badge
                    key={tag}
                    variant={field.value.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      field.value.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => {
                      const newValue = field.value.includes(tag)
                        ? field.value.filter((t: string) => t !== tag)
                        : [...field.value, tag]
                      field.onChange(newValue)
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

function Step5Form({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="contactInfo.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Email (Public)</FormLabel>
            <FormControl>
              <Input
                type="email"
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="your@email.com"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>This will be visible on your profile</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contactInfo.twitterUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Twitter (Optional)</FormLabel>
            <FormControl>
              <Input
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="https://twitter.com/yourusername"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contactInfo.linkedinUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">LinkedIn (Optional)</FormLabel>
            <FormControl>
              <Input
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="https://linkedin.com/in/yourusername"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contactInfo.scheduleUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Scheduling Link (Optional)</FormLabel>
            <FormControl>
              <Input
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500"
                placeholder="https://calendly.com/yourusername"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>Calendly, Cal.com, or similar</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step6Form({ form, fields, append, remove }: { form: UseFormReturn<FormValues>; fields: FieldArrayWithId<FormValues, "pastProjects", "id">[]; append: any; remove: any }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <FormLabel className="text-lg font-semibold text-white/90">Past Projects (Optional)</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: '', description: '', link: '' })}
          className="gap-2 border-gray-700 text-blue-400 hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="p-6 border border-dashed border-gray-700 rounded-lg text-center">
          <p className="text-gray-400">No projects added yet. Click &quot;Add Project&quot; to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field: FieldArrayWithId<FormValues, "pastProjects", "id">, index: number) => (
            <div key={field.id} className="p-5 border border-gray-700 rounded-lg bg-neutral-950 space-y-4">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm text-gray-500 font-semibold">Project {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-gray-500 hover:text-red-400 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <FormField
                control={form.control}
                name={`pastProjects.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white/85">Project Name</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-neutral-900 border-gray-700 text-white/90"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`pastProjects.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white/85">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="bg-neutral-900 border-gray-700 text-white/90 min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`pastProjects.${index}.link`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-white/85">Project Link</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-neutral-900 border-gray-700 text-white/90"
                        type="url"
                        placeholder="https://..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Step7Form({ form, skillOptions }: { form: UseFormReturn<FormValues>; skillOptions: string[] }) {
  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="startupInfo.stage"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Startup Stage (Optional)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="bg-neutral-950 border-gray-700 text-white/90">
                  <SelectValue placeholder="Select startup stage" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-neutral-900 border-gray-700">
                <SelectItem value="IDEA">Idea Stage</SelectItem>
                <SelectItem value="MVP">MVP</SelectItem>
                <SelectItem value="SCALING">Scaling</SelectItem>
                <SelectItem value="EXITED">Exited</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="startupInfo.goals"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Startup Goals (Optional)</FormLabel>
            <FormControl>
              <Textarea
                className="bg-neutral-950 border-gray-700 text-white/90 focus-visible:border-blue-500 min-h-[140px] resize-none"
                placeholder="Describe your startup goals and vision..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="startupInfo.commitment"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Commitment Level (Optional)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="bg-neutral-950 border-gray-700 text-white/90">
                  <SelectValue placeholder="Select commitment level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-neutral-900 border-gray-700">
                <SelectItem value="EXPLORING">Exploring</SelectItem>
                <SelectItem value="BUILDING">Building</SelectItem>
                <SelectItem value="LAUNCHING">Launching</SelectItem>
                <SelectItem value="FULL_TIME_READY">Full Time Ready</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="startupInfo.lookingFor"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white/90 font-semibold">Looking For (Optional)</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2 p-4 border border-gray-700 rounded-lg bg-neutral-950 max-h-56 overflow-y-auto">
                {skillOptions.map((tag) => (
                  <Badge
                    key={tag}
                    variant={field.value?.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      field.value?.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => {
                      const current = field.value ?? []
                      const newValue = current.includes(tag)
                        ? current.filter((t: string) => t !== tag)
                        : [...current, tag]
                      field.onChange(newValue)
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}