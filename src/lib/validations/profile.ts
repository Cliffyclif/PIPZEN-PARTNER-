import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(5, "Phone number is required"),
  address: z.string().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  desiredNetworkSize: z.number().min(1).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
