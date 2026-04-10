"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddReferralForm } from "@/components/forms/add-referral-form";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";

interface Purchase {
  id: string;
  amount: string;
  packageName: string;
  packageType: string;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    referrer: { id: string; fullName: string | null; email: string } | null;
  };
  seededBy: { id: string; fullName: string | null; email: string };
  _count: { commissions: number };
}

interface PurchasesClientProps {
  purchases: Purchase[];
  activePartners: { id: string; fullName: string | null; email: string }[];
}

export function PurchasesClient({ purchases, activePartners }: PurchasesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit form state
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editBuyerEmail, setEditBuyerEmail] = useState("");
  const [editPackageName, setEditPackageName] = useState("");
  const [editPackageType, setEditPackageType] = useState("INSTANT_FUNDING");
  const [editAmount, setEditAmount] = useState("");

  function openEditDialog(purchase: Purchase) {
    setSelectedPurchase(purchase);
    setEditBuyerName(purchase.user.fullName || "");
    setEditBuyerEmail(purchase.user.email);
    setEditPackageName(purchase.packageName);
    setEditPackageType(purchase.packageType);
    setEditAmount(String(Number(purchase.amount)));
    setEditOpen(true);
  }

  function openDeleteDialog(purchase: Purchase) {
    setSelectedPurchase(purchase);
    setDeleteOpen(true);
  }

  async function handleEdit() {
    if (!selectedPurchase) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/purchases/${selectedPurchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerName: editBuyerName,
          buyerEmail: editBuyerEmail,
          packageName: editPackageName,
          packageType: editPackageType,
          amount: Number(editAmount),
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to update purchase", variant: "destructive" });
        return;
      }

      toast({ title: "Updated", description: "Purchase updated successfully" });
      setEditOpen(false);
      router.refresh();
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedPurchase) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/purchases/${selectedPurchase.id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to delete purchase", variant: "destructive" });
        return;
      }

      toast({
        title: "Deleted",
        description: `Purchase deleted. ${result.commissionsDeleted} commission(s) removed.`,
      });
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
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Add Referral</DialogTitle>
            </DialogHeader>
            <AddReferralForm
              partners={activePartners}
              onSuccess={() => {
                setAddOpen(false);
                router.refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Purchases ({purchases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Buyer</TableHead>
                <TableHead className="text-slate-400">Referred By</TableHead>
                <TableHead className="text-slate-400">Package</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Commissions</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((p) => (
                <TableRow key={p.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-white">{p.user.fullName || "N/A"}</p>
                      <p className="text-xs text-slate-400">{p.user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.user.referrer ? (
                      <div>
                        <p className="text-sm text-slate-300">{p.user.referrer.fullName || "N/A"}</p>
                        <p className="text-xs text-slate-500">{p.user.referrer.email}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Direct</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">{p.packageName}</TableCell>
                  <TableCell className="text-sm text-slate-300">
                    {p.packageType === "INSTANT_FUNDING" ? "Instant Funding" : "Evaluation"}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-emerald-400">
                    {formatCurrency(Number(p.amount))}
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">{p._count.commissions}</TableCell>
                  <TableCell className="text-sm text-slate-400">{formatDate(p.createdAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(p)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700 cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
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
            <DialogTitle className="text-white">Edit Purchase</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update the buyer info and purchase details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Buyer Name</Label>
                <Input
                  value={editBuyerName}
                  onChange={(e) => setEditBuyerName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Buyer Email</Label>
                <Input
                  type="email"
                  value={editBuyerEmail}
                  onChange={(e) => setEditBuyerEmail(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Package Name</Label>
              <Input
                value={editPackageName}
                onChange={(e) => setEditPackageName(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Account Type</Label>
                <Select value={editPackageType} onValueChange={setEditPackageType}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="INSTANT_FUNDING">Instant Funding</SelectItem>
                    <SelectItem value="EVALUATION">Evaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
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
            <DialogTitle className="text-white">Delete Purchase</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this purchase? This will also remove{" "}
              <span className="text-amber-400 font-medium">
                {selectedPurchase?._count.commissions || 0} commission(s)
              </span>{" "}
              associated with it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-3 space-y-1">
              <p className="text-sm text-white font-medium">
                {selectedPurchase.user.fullName || selectedPurchase.user.email}
              </p>
              <p className="text-xs text-slate-400">
                {selectedPurchase.packageName} &middot; {formatCurrency(Number(selectedPurchase.amount))}
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
