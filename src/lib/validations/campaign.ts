import { z } from "zod";

export const campaignSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  goalType: z.enum(["REFERRAL_COUNT", "EARNINGS"]),
  goalValue: z.number().positive("Goal value must be positive"),
  rewardAmount: z.number().positive("Reward must be positive"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type CampaignInput = z.infer<typeof campaignSchema>;
