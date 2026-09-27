import { z } from "zod";
import { SUPPORT_CATEGORIES } from "@/lib/constants";

const categories = SUPPORT_CATEGORIES.map((c) => c.value) as [string, ...string[]];

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(150),
  category: z.enum(categories),
  message: z.string().trim().min(10, "Please describe the issue in at least 10 characters").max(5000),
});

export const supportReplySchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(5000),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
