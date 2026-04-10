import { z } from "zod";

export const settingsSchema = z.object({
  commission_level_1: z.coerce.number().min(0).max(100),
  commission_level_2: z.coerce.number().min(0).max(100),
  commission_level_3_plus: z.coerce.number().min(0).max(100),
  min_withdrawal: z.coerce.number().min(0),
  commission_auto_approve: z.boolean(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
