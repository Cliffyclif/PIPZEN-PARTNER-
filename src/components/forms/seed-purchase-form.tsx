"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { seedPurchaseSchema, type SeedPurchaseInput } from "@/lib/validations/purchase";
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
import { Loader2, Plus } from "lucide-react";

interface SeedPurchaseFormProps {
  partners: { id: string; fullName: string | null; email: string }[];
  onSuccess?: () => void;
}

export function SeedPurchaseForm({ partners, onSuccess }: SeedPurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SeedPurchaseInput>({
    resolver: zodResolver(seedPurchaseSchema),
    defaultValues: { userId: "", amount: 0, packageName: "", packageType: "INSTANT_FUNDING" },
  });

  async function onSubmit(data: SeedPurchaseInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchases/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to seed purchase", variant: "destructive" });
        return;
      }

      toast({
        title: "Success",
        description: `Purchase seeded! ${result.commissionsCreated} commission(s) created.`,
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
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Partner</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select partner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {partners.filter(p => p.fullName).map((p) => (
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

        <FormField
          control={form.control}
          name="packageName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Package Name</FormLabel>
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

        <FormField
          control={form.control}
          name="packageType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">Package Type</FormLabel>
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

        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Seed Purchase
        </Button>
      </form>
    </Form>
  );
}
