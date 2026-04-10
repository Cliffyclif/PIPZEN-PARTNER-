"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";

const addReferralSchema = z.object({
  partnerId: z.string().min(1, "Select a partner"),
  buyerName: z.string().min(1, "Buyer name is required"),
  buyerEmail: z.string().email("Invalid email"),
  packageName: z.string().min(1, "Package name is required"),
  packageType: z.enum(["INSTANT_FUNDING", "EVALUATION"]),
  amount: z.number().positive("Amount must be positive"),
});

type AddReferralInput = z.infer<typeof addReferralSchema>;

interface AddReferralFormProps {
  partners: { id: string; fullName: string | null; email: string }[];
  onSuccess?: () => void;
}

export function AddReferralForm({ partners, onSuccess }: AddReferralFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddReferralInput>({
    resolver: zodResolver(addReferralSchema),
    defaultValues: {
      partnerId: "",
      buyerName: "",
      buyerEmail: "",
      packageName: "",
      packageType: "INSTANT_FUNDING",
      amount: 0,
    },
  });

  async function onSubmit(data: AddReferralInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to add referral", variant: "destructive" });
        return;
      }

      toast({
        title: "Referral Added",
        description: `${data.buyerName} added under ${partners.find(p => p.id === data.partnerId)?.fullName || "partner"}. ${result.commissionsCreated} commission(s) created.`,
      });
      form.reset();
      onSuccess?.();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="partnerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Referred By (Partner)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select partner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="buyerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Buyer Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    className="bg-slate-900 border-slate-700 text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="buyerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Buyer Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="buyer@example.com"
                    className="bg-slate-900 border-slate-700 text-white"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="packageName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Package / Account Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. $50K Challenge"
                  className="bg-slate-900 border-slate-700 text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="packageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="INSTANT_FUNDING">Instant Funding</SelectItem>
                    <SelectItem value="EVALUATION">Evaluation</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Purchase Amount ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    className="bg-slate-900 border-slate-700 text-white"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          Add Referral
        </Button>
      </form>
    </Form>
  );
}
