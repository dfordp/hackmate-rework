/* eslint-disable @typescript-eslint/no-unused-vars */
  'use client'

  import { zodResolver } from "@hookform/resolvers/zod"
  import { useFieldArray, useForm } from "react-hook-form"
  import * as z from "zod"
  import axios from "axios" // Add axios import
  import { useEffect, useState } from "react" // For loading state
  import { useRouter } from "next/navigation" // For navigation after submission
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
  import { X, Plus } from "lucide-react"
  import { useUser } from "@clerk/nextjs"
  import { toast } from "sonner"
  import { CloudinaryError, uploadOnCloudinary } from '@/lib/cloudinary';
  import { M_PLUS_1p } from "next/font/google"
  import Image from "next/image"
import { extractFormSubmitErrorMessages } from "@/lib/utils"

  const mPlus1p = M_PLUS_1p({
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700']
  })



  // Constants for file upload
  const MAX_FILE_SIZE = 5 * 1024 * 1024
  const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  // Form Schema
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
      stage: z.enum(['IDEA', 'MVP', 'SCALING', 'EXITED']),
      goals: z.string().min(50, "Please describe your startup goals in detail"),
      commitment: z.enum(['EXPLORING', 'BUILDING', 'LAUNCHING', 'FULL_TIME_READY']),
      lookingFor: z.array(z.string()).min(1, "Select what you're looking for").optional(),
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
    "Frontend Development",
    "Backend Development",
    "Full Stack Development",
    "Mobile Development",
    "UI/UX Design",
    "Product Management",
    "Business Development",
    "Sales",
    "Marketing & Growth",
    "Finance & Accounting",
    "Fundraising",
    "Operations & Management",
    "Data Science",
    "Machine Learning / AI",
    "Cloud & DevOps",
    "Cybersecurity",
    "Hardware Engineering",
    "Research & Analysis",
    "Legal & Compliance",
    "People & HR"
  ];

  const domainOptions = [
  "Software Development",
  "Product & Design",
  "Business & Strategy",
  "Growth & Marketing",
  "Finance & Legal",
  "Sales & Partnerships",
  "Data & AI",
  "Hardware & Engineering",
  "Research & Innovation",
  "People & Culture"
];

  export default function OnboardingForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useUser();
    const userId = user?.id;
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const email = typeof user?.primaryEmailAddress === "string"
      ? user.primaryEmailAddress
      : user?.primaryEmailAddress?.emailAddress ?? "";


    useEffect(() => {
      // Check if user exists and has completed onboarding
      if (userId) {
        const checkUserProfile = async () => {
          try {
            const response = await axios.get(`/api/user/${userId}`);
            // If user profile exists, redirect to explore page
            if (response.data) {
              router.push('/explore');
            }
          } catch (error) {
            // If 404, it means profile doesn't exist yet, so stay on onboarding
            // For other errors, we still allow onboarding to continue
            
          } finally {
            setIsLoading(false);
          }
        };
        
        checkUserProfile();
      } else {
        setIsLoading(false);
      }
    }, [userId, router]);
    
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
        }
      },
    })

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "pastProjects",
    })

    async function onSubmit(values: FormValues) {
      setIsSubmitting(true)
      
      try {
        // Create FormData object for multipart/form-data submission
        const formData = new FormData()
        let avatarUrl: string | undefined;
        
        // Add avatar file if it exists
        if (values.avatar?.[0]) {
            const uploadResult = await uploadOnCloudinary(values.avatar[0]);
            avatarUrl = uploadResult.secure_url;
        }
        
        // Prepare the user data object
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
          pastProjects: values.pastProjects,
          startupInfo: values.startupInfo,
          contactInfo: values.contactInfo,
          avatarUrl: avatarUrl,
        }
        
        // Add the userData as a JSON string
        formData.append('userData', JSON.stringify(userData))
        
        // Submit the form data to the API
        const response = await axios.post('/api/user', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        
        //update clerk pfp
        if (values.avatar?.[0] && user) {
          try {
            console.log('Updating Clerk profile image...');
            await user.setProfileImage({ file: values.avatar[0] });
            console.log('Clerk profile image updated successfully');
          } catch (clerkError) {
            console.error('Error updating Clerk profile image:', clerkError);
          }
        }
        
        // Redirect to another page or show success message
        toast.success('Profile created successfully')
        router.push('/explore') // Adjust the route as needed
        
      }catch (error) {
          let message = 'Unexpected error occurred.';

          // Cloudinary-specific errors
          if (error instanceof CloudinaryError) {
            console.error('Cloudinary upload failed:', error.details);
            message = error.message;

          // Axios / API errors
          } else if (axios.isAxiosError(error)) {
            // Try to get message from response.data.error or response.data.message
            message =
              error.response?.data?.error ||
              error.response?.data?.message ||
              error.message;

          // Generic JS errors
          } else if (error instanceof Error) {
            message = error.message;
          }

          toast.error(message);
          console.error(error); // Log full error for debugging
        } finally {
        setIsSubmitting(false)
      }
    }

    const onError = (formErrors: typeof form.formState.errors) =>
      extractFormSubmitErrorMessages(formErrors).forEach(msg => toast.warning(msg));

    if (isLoading) {
      return <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>;
    }
    
    return (
      <div className="max-w-3xl mx-2 sm:mx-4 md:mx-auto p-6 space-y-8 bg-neutral-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>
            Complete Your Profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400" style={{ ...mPlus1p.style, fontWeight: 400 }}>
            Tell us about yourself to get started with HackMate.
          </p>

        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Name</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }}
                        placeholder="Your name"
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
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Location</FormLabel>
                    <FormControl>
                      <Input 
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }}
                      placeholder="Your location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="avatar"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Profile Picture</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      {value && (
                        <Image
                          src={URL.createObjectURL(value[0])}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover"
                          width={100}
                          height={100}
                        />
                      )}
                      <Input
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(",")}
                        onChange={(e) => onChange(e.target.files)}
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 400 }}>
                    Upload a profile picture (max 5MB, JPEG, PNG or WebP)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>About You</FormLabel>
                  <FormControl>
                    <Textarea
                      className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500 min-h-[100px]"
                      style={{ ...mPlus1p.style, fontWeight: 400 }}
                      placeholder="Tell us about yourself, your background, and what you're looking for..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Current Role</FormLabel>
                    <FormControl>
                      <Input 
                      className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                      style={{ ...mPlus1p.style, fontWeight: 400 }}
                      placeholder="Software Engineer" {...field} />
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
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Years of Experience</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
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
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Working Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                          className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                          style={{ ...mPlus1p.style, fontWeight: 400 }}   
                          placeholder="Select working style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Collaboration Preference</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                          className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                          style={{ ...mPlus1p.style, fontWeight: 400 }}   
                          placeholder="Select preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="personalityTags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel  className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Personality Traits</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 p-4 border rounded-md">
                        {personalityOptions.map((tag) => (
                          <Badge
                            key={tag}
                          variant={field.value.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            field.value.includes(tag)
                              ? 'bg-blue-500/40 text-white'
                              : 'border-white/30 text-white/55'
                          } transition-all duration-200`}
                          onClick={() => {
                              const newValue = field.value.includes(tag)
                                ? field.value.filter((t) => t !== tag)
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
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Domain Expertise</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 p-4 border rounded-md">
                        {domainOptions.map((tag) => (
                          <Badge
                          key={tag}
                          variant={field.value.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            field.value.includes(tag)
                              ? 'bg-blue-500/40 text-white'
                              : 'border-white/30 text-white/55'
                          } transition-all duration-200`}
                          onClick={() => {
                              const newValue = field.value.includes(tag)
                                ? field.value.filter((t) => t !== tag)
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
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Skills</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 p-4 border rounded-md">
                        {skillOptions.map((tag) => (
                          <Badge
                            key={tag}
                          variant={field.value.includes(tag) ? "default" : "outline"}
                          className={`cursor-pointer ${
                            field.value.includes(tag)
                              ? 'bg-blue-500/40 text-white'
                              : 'border-white/30 text-white/55'
                          } transition-all duration-200`}
                          onClick={() => {
                              const newValue = field.value.includes(tag)
                                ? field.value.filter((t) => t !== tag)
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

            <div className="space-y-6 border rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Contact Information</h3>
              
              <FormField
                control={form.control}
                name="contactInfo.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Email</FormLabel>
                    <FormControl>
                      <Input type="email"
                      className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                      style={{ ...mPlus1p.style, fontWeight: 400 }} 
                      placeholder="your@email.com" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription 
                        className="border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }} >
                      Your public contact email (can be different from your login email)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="contactInfo.twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Twitter Profile (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }} 
                        placeholder="https://twitter.com/yourusername" {...field} value={field.value || ''} />
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
                      <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>LinkedIn Profile (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                         className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }} 
                        placeholder="https://linkedin.com/in/yourusername" {...field} value={field.value || ''} />
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
                      <FormLabel className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 700 }}>Scheduling Link (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                        style={{ ...mPlus1p.style, fontWeight: 400 }} 
                        placeholder="https://calendly.com/yourusername" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription
                      className="font-bold text-white/85" style={{ ...mPlus1p.style, fontWeight: 400 }}>
                        Link to your Calendly, Cal.com or other scheduling service
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel className="text-lg font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Past Projects</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', description: '', link: '' })}
                  className="font-medium hover:cursor-pointer" style={{ ...mPlus1p.style, fontWeight: 700 }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Project
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start p-4 border rounded-md">
                  <div className="flex-1 space-y-4">
                    <FormField
                      control={form.control}
                      name={`pastProjects.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Project Name</FormLabel>
                          <FormControl>
                            <Input
                             className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                             style={{ ...mPlus1p.style, fontWeight: 400 }} 
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
                          <FormLabel className="font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                            className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                             style={{ ...mPlus1p.style, fontWeight: 400 }} 
                            {...field} />
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
                          <FormLabel className="font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Project Link</FormLabel>
                          <FormControl>
                            <Input {...field} 
                             className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                             style={{ ...mPlus1p.style, fontWeight: 400 }} 
                            type="url" placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="hover:cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-6 border rounded-lg p-6">
              <h3 className="text-lg font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Startup Information</h3>
              
              <FormField
                control={form.control}
                name="startupInfo.stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Startup Stage</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                          className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                          style={{ ...mPlus1p.style, fontWeight: 400 }}   
                          placeholder="Select Stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel className="font-medium" style={{ ...mPlus1p.style, fontWeight: 700 }}>Startup Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500 min-h-[100px]"
                        style={{ ...mPlus1p.style, fontWeight: 400 }} 
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
                    <FormLabel>Commitment Level</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select commitment level" 
                           className="bg-neutral-950 border-gray-700 text-white/85 placeholder:text-gray-500 focus:ring-blue-500"
                          style={{ ...mPlus1p.style, fontWeight: 400 }}   />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Looking For</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 p-4 border rounded-md">
                        {skillOptions.map((tag) => (
                          <Badge
                            key={tag}
                            variant={field.value?.includes(tag) ? "default" : "outline"}
                            className={`cursor-pointer ${
                              field.value?.includes(tag)
                                ? 'bg-blue-500/40 text-white'
                              : 'border-white/30 text-white/55'
                          } transition-all duration-200`}
                          onClick={() => {
                          const current = field.value ?? [];  // fallback to [] if undefined
                          const newValue = current.includes(tag)
                            ? current.filter((t) => t !== tag)
                            : [...current, tag];
                          field.onChange(newValue);
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

            <Button className="w-full bg-blue-500/40 text-white font-medium rounded-md transition-all duration-300 ease-out hover:bg-blue-700/60" disabled={isSubmitting}>
              {isSubmitting ? "Creating Profile..." : "Complete Profile"}
            </Button>
          </form>
        </Form>
      </div>
    )
  }
