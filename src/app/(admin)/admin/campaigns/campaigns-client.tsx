"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { campaignSchema, type CampaignInput } from "@/lib/validations/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Loader2, Trophy } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goalType: string;
  goalValue: string;
  rewardAmount: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function CampaignsClient({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<CampaignInput>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { title: "", description: "", goalType: "REFERRAL_COUNT", goalValue: 0, rewardAmount: 0, startDate: "", endDate: "" },
  });

  async function onSubmit(data: CampaignInput) {
    setLoading(true);
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast({ title: "Success", description: "Campaign created" });
      setOpen(false);
      form.reset();
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader><DialogTitle className="text-white">Create Campaign</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Title</FormLabel><FormControl><Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Description</FormLabel><FormControl><Textarea className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="goalType" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Goal Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="REFERRAL_COUNT">Referral Count</SelectItem>
                          <SelectItem value="EARNINGS">Earnings</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="goalValue" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Goal Value</FormLabel><FormControl><Input type="number" className="bg-slate-900 border-slate-700 text-white" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="rewardAmount" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Reward ($)</FormLabel><FormControl><Input type="number" className="bg-slate-900 border-slate-700 text-white" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">Start</FormLabel><FormControl><Input type="date" className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel className="text-slate-300">End</FormLabel><FormControl><Input type="date" className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl></FormItem>
                  )} />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Campaign
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((c) => (
          <Card key={c.id} className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-white text-base">{c.title}</CardTitle>
              </div>
              <StatusBadge status={c.status} />
            </CardHeader>
            <CardContent className="space-y-2">
              {c.description && <p className="text-sm text-slate-400">{c.description}</p>}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">Goal:</span> <span className="text-white">{Number(c.goalValue)} {c.goalType === "REFERRAL_COUNT" ? "referrals" : "in earnings"}</span></div>
                <div><span className="text-slate-500">Reward:</span> <span className="text-emerald-400">{formatCurrency(Number(c.rewardAmount))}</span></div>
                <div><span className="text-slate-500">Start:</span> <span className="text-slate-300">{formatDate(c.startDate)}</span></div>
                <div><span className="text-slate-500">End:</span> <span className="text-slate-300">{formatDate(c.endDate)}</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
