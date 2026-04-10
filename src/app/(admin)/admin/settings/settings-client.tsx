"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";

interface SettingsClientProps {
  settings: Record<string, string>;
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState(settings);

  async function handleSave() {
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      toast({ title: "Success", description: "Settings saved" });
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Commission Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">Level 1 (Direct Referrer) %</Label>
            <Input
              type="number"
              value={values.commission_level_1 || "6"}
              onChange={(e) => setValues({ ...values, commission_level_1: e.target.value })}
              className="bg-slate-900 border-slate-700 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Level 2 %</Label>
            <Input
              type="number"
              value={values.commission_level_2 || "3"}
              onChange={(e) => setValues({ ...values, commission_level_2: e.target.value })}
              className="bg-slate-900 border-slate-700 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Level 3+ %</Label>
            <Input
              type="number"
              value={values.commission_level_3_plus || "1"}
              onChange={(e) => setValues({ ...values, commission_level_3_plus: e.target.value })}
              className="bg-slate-900 border-slate-700 text-white mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">Minimum Withdrawal ($)</Label>
            <Input
              type="number"
              value={values.min_withdrawal || "50"}
              onChange={(e) => setValues({ ...values, min_withdrawal: e.target.value })}
              className="bg-slate-900 border-slate-700 text-white mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}
