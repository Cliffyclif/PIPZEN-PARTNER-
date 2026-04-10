import { z } from "zod";

const bankDetailsSchema = z.object({
  method: z.literal("BANK"),
  amount: z.number().positive("Amount must be positive"),
  bankName: z.string().min(1, "Bank name is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountHolder: z.string().min(1, "Account holder name is required"),
});

const cryptoDetailsSchema = z.object({
  method: z.literal("CRYPTO"),
  amount: z.number().positive("Amount must be positive"),
  walletAddress: z.string().min(1, "Wallet address is required"),
  cryptoType: z.string().min(1, "Cryptocurrency type is required"),
  cryptoNetwork: z.string().min(1, "Network is required"),
});

export const withdrawalSchema = z.discriminatedUnion("method", [
  bankDetailsSchema,
  cryptoDetailsSchema,
]);

export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
