"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InvitePartnerForm } from "@/components/forms/invite-partner-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { NetworkOverlay } from "@/components/admin/network-overlay";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Ban, ShieldCheck, Loader2, Eye } from "lucide-react";

interface Partner {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  status: string;
  pipzenReferralLink: string | null;
  createdAt: string;
  referrer: { id: string; fullName: string | null; email: string } | null;
  _count: { referrals: number; earnedCommissions: number };
}

interface PartnersClientProps {
  partners: Partner[];
  activePartners: { id: string; fullName: string | null; email: string }[];
}

export function PartnersClient({ partners, activePartners }: PartnersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [networkPartner, setNetworkPartner] = useState<{ id: string; name: string }>({ id: "", name: "" });

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRefLink, setEditRefLink] = useState("");
  const [editReferrerId, setEditReferrerId] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");

  function openEditDialog(partner: Partner) {
    setSelectedPartner(partner);
    setEditName(partner.fullName || "");
    setEditEmail(partner.email);
    setEditPhone(partner.phone || "");
    setEditRefLink(partner.pipzenReferralLink || "");
    setEditReferrerId(partner.referrer?.id || "none");
    setEditStatus(partner.status);
    setEditOpen(true);
  }

  function openDeleteDialog(partner: Partner) {
    setSelectedPartner(partner);
    setDeleteOpen(true);
  }

  async function toggleBan(partnerId: string, currentStatus: string) {
    const newStatus = currentStatus === "BANNED" ? "ACTIVE" : "BANNED";
    const res = await fetch(`/api/admin/partners/${partnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      toast({ title: "Success", description: `Partner ${newStatus === "BANNED" ? "banned" : "unbanned"}` });
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to update partner", variant: "destructive" });
    }
  }

  async function handleEdit() {
    if (!selectedPartner) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editName || undefined,
          email: editEmail,
          phone: editPhone || null,
          pipzenReferralLink: editRefLink || null,
          referrerId: editReferrerId === "none" ? null : editReferrerId || null,
          status: editStatus,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        const msg = typeof result.error === "string" ? result.error : "Failed to update partner";
        toast({ title: "Error", description: msg, variant: "destructive" });
        return;
      }

      toast({ title: "Updated", description: "Partner updated successfully" });
      setEditOpen(false);
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedPartner) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Failed to delete partner", variant: "destructive" });
        return;
      }
      toast({ title: "Deleted", description: `${selectedPartner.fullName || selectedPartner.email} has been removed.` });
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Invite New Partner</DialogTitle>
            </DialogHeader>
            <InvitePartnerForm
              partners={activePartners}
              onSuccess={() => {
                setInviteOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Partners ({partners.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Partner</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Referrer</TableHead>
                <TableHead className="text-slate-400">Referrals</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-white">{p.fullName || "Pending"}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">
                    {p.referrer?.fullName || p.referrer?.email || "None"}
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">
                    {p._count.referrals}
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          onClick={() => {
                            setNetworkPartner({ id: p.id, name: p.fullName || p.email });
                            setNetworkOpen(true);
                          }}
                          className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Network
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(p)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {p.status !== "INVITED" && (
                          <DropdownMenuItem
                            onClick={() => toggleBan(p.id, p.status)}
                            className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer"
                          >
                            {p.status === "BANNED" ? (
                              <><ShieldCheck className="mr-2 h-4 w-4" /> Unban</>
                            ) : (
                              <><Ban className="mr-2 h-4 w-4" /> Ban</>
                            )}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(p)}
                          className="text-red-400 focus:text-red-300 focus:bg-slate-700 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Partner</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update partner details and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Full Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Optional"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="INVITED">Invited</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="BANNED">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">PipZen Referral Link</Label>
              <Input
                value={editRefLink}
                onChange={(e) => setEditRefLink(e.target.value)}
                placeholder="https://pipzen.io/ref/..."
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Referred By</Label>
              <Select value={editReferrerId} onValueChange={setEditReferrerId}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="No referrer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">No referrer</SelectItem>
                  {activePartners
                    .filter((ap) => ap.id !== selectedPartner?.id)
                    .map((ap) => (
                      <SelectItem key={ap.id} value={ap.id}>
                        {ap.fullName || ap.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editLoading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Partner</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this partner? This will remove all their purchases,
              commissions, withdrawals, messages, and notifications. Their referrals will be unlinked.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-3 space-y-1">
              <p className="text-sm text-white font-medium">
                {selectedPartner.fullName || "Pending"}
              </p>
              <p className="text-xs text-slate-400">
                {selectedPartner.email} &middot; {selectedPartner._count.referrals} referral(s) &middot; {selectedPartner._count.earnedCommissions} commission(s)
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="text-slate-400 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Network Tree Overlay */}
      <NetworkOverlay
        open={networkOpen}
        onOpenChange={setNetworkOpen}
        partnerId={networkPartner.id}
        partnerName={networkPartner.name}
      />
    </div>
  );
}
