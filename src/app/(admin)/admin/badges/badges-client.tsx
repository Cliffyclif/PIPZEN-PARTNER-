"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BadgeCheck, Plus, Pencil, Trash2, Loader2, Users, DollarSign, Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BadgeData {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  referralThreshold: number;
  rewardAmount: number | string;
  isActive: boolean;
  createdAt: string;
  _count: { awards: number };
}

interface BadgesClientProps {
  initialBadges: BadgeData[];
}

const emptyForm = {
  name: "",
  description: "",
  referralThreshold: "",
  rewardAmount: "",
  hasReward: true,
  isActive: true,
};

export function BadgesClient({ initialBadges }: BadgesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [badges, setBadges] = useState(initialBadges);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BadgeData | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditingBadge(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(badge: BadgeData) {
    setEditingBadge(badge);
    const reward = Number(badge.rewardAmount);
    setForm({
      name: badge.name,
      description: badge.description || "",
      referralThreshold: badge.referralThreshold.toString(),
      rewardAmount: reward > 0 ? reward.toString() : "",
      hasReward: reward > 0,
      isActive: badge.isActive,
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name || !form.referralThreshold || (form.hasReward && !form.rewardAmount)) {
      toast({ title: "Error", description: "Name and threshold are required. Reward amount is required when enabled.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        referralThreshold: Number(form.referralThreshold),
        rewardAmount: form.hasReward ? Number(form.rewardAmount) : 0,
        isActive: form.isActive,
      };

      if (editingBadge) {
        const res = await fetch(`/api/admin/badges/${editingBadge.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update badge");
        setBadges((prev) =>
          prev.map((b) => (b.id === editingBadge.id ? { ...b, ...payload } : b))
        );
        toast({ title: "Badge updated", description: `"${form.name}" has been updated.` });
      } else {
        const res = await fetch("/api/admin/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create badge");
        toast({ title: "Badge created", description: `"${form.name}" has been created.` });
        router.refresh();
      }

      setShowDialog(false);
      setEditingBadge(null);
      if (!editingBadge) {
        // Refetch after create to get the new badge with _count
        const res = await fetch("/api/admin/badges");
        const data = await res.json();
        setBadges(data);
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/badges/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete badge");
      setBadges((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      toast({ title: "Badge deleted", description: `"${deleteTarget.name}" has been removed.` });
      setDeleteTarget(null);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(badge: BadgeData) {
    const newActive = !badge.isActive;
    setBadges((prev) =>
      prev.map((b) => (b.id === badge.id ? { ...b, isActive: newActive } : b))
    );
    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({
        title: newActive ? "Badge activated" : "Badge deactivated",
        description: `"${badge.name}" is now ${newActive ? "active" : "inactive"}.`,
      });
    } catch {
      setBadges((prev) =>
        prev.map((b) => (b.id === badge.id ? { ...b, isActive: !newActive } : b))
      );
      toast({ title: "Error", description: "Failed to update badge status.", variant: "destructive" });
    }
  }

  const totalAwarded = badges.reduce((sum, b) => sum + b._count.awards, 0);
  const activeBadges = badges.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{badges.length}</p>
              <p className="text-xs text-slate-400">Total Badges</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeBadges}</p>
              <p className="text-xs text-slate-400">Active Badges</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalAwarded}</p>
              <p className="text-xs text-slate-400">Total Awards Given</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add badge button */}
      <div className="flex justify-end">
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Badge
        </Button>
      </div>

      {/* Badge grid */}
      {badges.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="py-12 text-center">
            <BadgeCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No badges created yet. Click &quot;Add Badge&quot; to create your first milestone.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <Card
              key={badge.id}
              className={`bg-slate-800/50 border-slate-700 transition-opacity ${!badge.isActive ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <BadgeCheck className="w-5 h-5 text-amber-400" />
                    </div>
                    <CardTitle className="text-white text-base">{badge.name}</CardTitle>
                  </div>
                  <Switch
                    checked={badge.isActive}
                    onCheckedChange={() => toggleActive(badge)}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {badge.description && (
                  <p className="text-slate-400 text-sm">{badge.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Threshold
                    </span>
                    <span className="text-white font-medium">{badge.referralThreshold} referrals</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Reward
                    </span>
                    {Number(badge.rewardAmount) > 0 ? (
                      <span className="text-emerald-400 font-medium">
                        {formatCurrency(Number(badge.rewardAmount))}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">No reward</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5" /> Awarded
                    </span>
                    <span className="text-white font-medium">{badge._count.awards} partner(s)</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                    onClick={() => openEdit(badge)}
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => setDeleteTarget(badge)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingBadge ? "Edit Badge" : "Create New Badge"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingBadge
                ? "Update the badge details below."
                : "Set up a new milestone badge for your partners."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">Badge Name *</Label>
              <Input
                placeholder="e.g. Gold Network"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Input
                placeholder="e.g. Reach 100 direct referrals"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Referral Threshold *</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={form.referralThreshold}
                onChange={(e) => setForm({ ...form, referralThreshold: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">Number of direct referrals needed to earn this badge</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-700 p-3">
              <div>
                <Label className="text-slate-300">Include Reward Amount</Label>
                <p className="text-xs text-slate-500 mt-0.5">Give a cash bonus when this badge is earned</p>
              </div>
              <Switch
                checked={form.hasReward}
                onCheckedChange={(checked) => setForm({ ...form, hasReward: checked, rewardAmount: checked ? form.rewardAmount : "" })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {form.hasReward && (
              <div className="space-y-2">
                <Label className="text-slate-300">Reward Amount ($) *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={form.rewardAmount}
                  onChange={(e) => setForm({ ...form, rewardAmount: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">Bonus cash reward when partner earns this badge</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-slate-700 p-3">
              <div>
                <Label className="text-slate-300">Active</Label>
                <p className="text-xs text-slate-500 mt-0.5">Inactive badges won&apos;t be awarded to partners</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingBadge ? "Save Changes" : "Create Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Badge</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
              {deleteTarget && deleteTarget._count.awards > 0 && (
                <span className="block mt-2 text-amber-400">
                  Note: This badge has been awarded to {deleteTarget._count.awards} partner(s).
                  You may want to deactivate it instead.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
