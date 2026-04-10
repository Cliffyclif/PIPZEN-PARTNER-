"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const bankSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(1, "Required"),
  accountNumber: z.string().min(1, "Required"),
  accountHolder: z.string().min(1, "Required"),
});

const cryptoSchema = z.object({
  amount: z.number().positive(),
  walletAddress: z.string().min(1, "Required"),
  cryptoType: z.string().min(1, "Required"),
  cryptoNetwork: z.string().min(1, "Required"),
});

interface WithdrawalFormProps {
  availableBalance: number;
  minWithdrawal: number;
  onSuccess?: () => void;
}

export function WithdrawalForm({ availableBalance, minWithdrawal, onSuccess }: WithdrawalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"BANK" | "CRYPTO">("BANK");

  const bankForm = useForm<z.infer<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    defaultValues: { amount: 0, bankName: "", accountNumber: "", accountHolder: "" },
  });

  const cryptoForm = useForm<z.infer<typeof cryptoSchema>>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: { amount: 0, walletAddress: "", cryptoType: "USDT", cryptoNetwork: "TRC20" },
  });

  async function submitWithdrawal(data: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch("/api/partner/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, method }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to submit", variant: "destructive" });
        return;
      }

      toast({ title: "Success", description: "Withdrawal request submitted" });
      router.refresh();
      onSuccess?.();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-lg p-4">
        <p className="text-sm text-slate-400">Available Balance</p>
        <p className="text-2xl font-bold text-emerald-400">{formatCurrency(availableBalance)}</p>
        <p className="text-xs text-slate-500 mt-1">Min withdrawal: {formatCurrency(minWithdrawal)}</p>
      </div>

      <Tabs defaultValue="BANK" onValueChange={(v) => setMethod(v as "BANK" | "CRYPTO")}>
        <TabsList className="bg-slate-900 w-full">
          <TabsTrigger value="BANK" className="flex-1">Bank Transfer</TabsTrigger>
          <TabsTrigger value="CRYPTO" className="flex-1">Cryptocurrency</TabsTrigger>
        </TabsList>

        <TabsContent value="BANK">
          <Form {...bankForm}>
            <form onSubmit={bankForm.handleSubmit(submitWithdrawal)} className="space-y-3">
              <FormField control={bankForm.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Amount ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" className="bg-slate-900 border-slate-700 text-white" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={bankForm.control} name="bankName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Bank Name</FormLabel>
                  <FormControl><Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={bankForm.control} name="accountNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Account Number</FormLabel>
                  <FormControl><Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={bankForm.control} name="accountHolder" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Account Holder</FormLabel>
                  <FormControl><Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Withdrawal
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="CRYPTO">
          <Form {...cryptoForm}>
            <form onSubmit={cryptoForm.handleSubmit(submitWithdrawal)} className="space-y-3">
              <FormField control={cryptoForm.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Amount ($)</FormLabel>
                  <FormControl><Input type="number" step="0.01" className="bg-slate-900 border-slate-700 text-white" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={cryptoForm.control} name="walletAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Wallet Address</FormLabel>
                  <FormControl><Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={cryptoForm.control} name="cryptoType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Cryptocurrency</FormLabel>
                  <FormControl><Input className="bg-slate-900 border-slate-700 text-white" placeholder="USDT, BTC, ETH" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={cryptoForm.control} name="cryptoNetwork" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Network</FormLabel>
                  <FormControl><Input className="bg-slate-900 border-slate-700 text-white" placeholder="TRC20, ERC20" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Request Withdrawal
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
