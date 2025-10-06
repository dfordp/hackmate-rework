import { clsx, type ClassValue } from "clsx";
import { FieldErrors } from "react-hook-form";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractFormSubmitErrorMessages(errors: FieldErrors<{ name: string; description: string; location: string; currentRole: string; yearsExperience: number; workingStyle: "ASYNC" | "REAL_TIME" | "FLEXIBLE" | "STRUCTURED"; collaborationPref: "REMOTE" | "HYBRID" | "IN_PERSON" | "DOESNT_MATTER"; personalityTags: string[]; domainExpertise: string[]; skills: string[]; avatar?: FileList | undefined; pastProjects?: { name: string; description: string; link?: string | undefined; }[] | undefined; startupInfo?: { stage: "IDEA" | "MVP" | "SCALING" | "EXITED"; goals: string; commitment: "EXPLORING" | "BUILDING" | "LAUNCHING" | "FULL_TIME_READY"; lookingFor?: string[] | undefined; } | undefined; contactInfo?: { email?: string | undefined; twitterUrl?: string | undefined; linkedinUrl?: string | undefined; scheduleUrl?: string | undefined; } | undefined; }>): string[] {
  let messages: string[] = [];

  const errorObj = errors as Record<string, unknown>;
  for (const key in errorObj) {
    if (!errorObj.hasOwnProperty(key)) continue;

    const err = errorObj[key];

    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      messages.push((err as { message: string }).message);
    }

    // Handle nested objects, e.g., startupInfo.goals
    if (typeof err === "object" && err !== null) {
      messages = messages.concat(extractFormSubmitErrorMessages(err));
    }
  }

  return messages;
}