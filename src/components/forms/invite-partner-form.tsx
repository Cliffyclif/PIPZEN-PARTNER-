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
import { Loader2, Send } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  referrerId: z.string().optional(),
  pipzenReferralLink: z.string().min(1, "Referral link is required"),
});

type InviteInput = z.infer<typeof inviteSchema>;

interface InvitePartnerFormProps {
  partners: { id: string; fullName: string | null; email: string }[];
  onSuccess?: () => void;
}

export function InvitePartnerForm({ partners, onSuccess }: InvitePartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", referrerId: "", pipzenReferralLink: "" },
  });

  async function onSubmit(data: InviteInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to invite partner", variant: "destructive" });
        return;
      }

      if (result.emailSent === false) {
        toast({
          title: "Partner created, but email failed",
          description: result.emailError || "Could not send invitation email. You can share the registration link manually.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "Invitation sent successfully" });
      }
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Email Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="partner@example.com"
                  type="email"
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
          name="referrerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Referrer (optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select referrer..." />
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

        <FormField
          control={form.control}
          name="pipzenReferralLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">PipZen Referral Link *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://pipzen.io/ref/..."
                  className="bg-slate-900 border-slate-700 text-white"
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-slate-500">The partner&apos;s referral link on pipzen.io</p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Send Invitation
        </Button>
      </form>
    </Form>
  );
}
