import { z } from "zod";

export const seedPurchaseSchema = z.object({
  userId: z.string().min(1, "Partner is required"),
  amount: z.number().positive("Amount must be positive"),
  packageName: z.string().min(1, "Package name is required"),
  packageType: z.enum(["INSTANT_FUNDING", "EVALUATION"]),
});

export type SeedPurchaseInput = z.infer<typeof seedPurchaseSchema>;
