"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { CopyButton } from "@/components/shared/copy-button";

interface PartnerSettingsClientProps {
  profile: {
    fullName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    socialMedia: Record<string, string> | null;
    desiredNetworkSize: number | null;
    pipzenReferralLink: string | null;
  };
}

export function PartnerSettingsClient({ profile }: PartnerSettingsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName || "",
      phone: profile.phone || "",
      address: profile.address || "",
      socialMedia: {
        instagram: profile.socialMedia?.instagram || "",
        twitter: profile.socialMedia?.twitter || "",
        linkedin: profile.socialMedia?.linkedin || "",
        tiktok: profile.socialMedia?.tiktok || "",
      },
      desiredNetworkSize: profile.desiredNetworkSize || undefined,
    },
  });

  async function onSubmit(data: ProfileInput) {
    setLoading(true);
    const res = await fetch("/api/partner/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast({ title: "Success", description: "Profile updated" });
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Referral Link</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.pipzenReferralLink ? (
            <>
              <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3">
                <code className="text-sm text-amber-400 flex-1 truncate">{profile.pipzenReferralLink}</code>
                <CopyButton text={profile.pipzenReferralLink} />
              </div>
              <p className="text-xs text-slate-500 mt-2">Share this link on pipzen.io to grow your network</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Your referral link has not been set up yet. Please contact your admin.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-3">
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm text-white">{profile.email}</p>
              </div>

              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem><FormLabel className="text-slate-300">Full Name</FormLabel><FormControl>
                  <Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel className="text-slate-300">Phone</FormLabel><FormControl>
                  <Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel className="text-slate-300">Address</FormLabel><FormControl>
                  <Textarea className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl></FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="socialMedia.instagram" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Instagram</FormLabel><FormControl>
                    <Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="socialMedia.twitter" render={({ field }) => (
                  <FormItem><FormLabel className="text-slate-300">Twitter/X</FormLabel><FormControl>
                    <Input className="bg-slate-900 border-slate-700 text-white" {...field} /></FormControl></FormItem>
                )} />
              </div>

              <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
