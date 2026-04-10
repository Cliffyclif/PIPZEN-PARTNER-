"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: string;
  method: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  walletAddress: string | null;
  cryptoType: string | null;
  cryptoNetwork: string | null;
  status: string;
  adminNote: string | null;
  requestedAt: string;
  user: { id: string; fullName: string | null; email: string };
}

interface AdminWithdrawalsClientProps {
  withdrawals: Withdrawal[];
}

export function AdminWithdrawalsClient({ withdrawals }: AdminWithdrawalsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function processWithdrawal(status: "APPROVED" | "REJECTED") {
    if (!selected) return;
    setLoading(true);

    const res = await fetch(`/api/admin/withdrawals/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: note || undefined }),
    });

    if (res.ok) {
      toast({ title: "Success", description: `Withdrawal ${status.toLowerCase()}` });
      setSelected(null);
      setNote("");
      router.refresh();
    } else {
      toast({ title: "Error", description: "Failed to process", variant: "destructive" });
    }
    setLoading(false);
  }

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Withdrawals ({withdrawals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Partner</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Method</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id} className="border-slate-700">
                  <TableCell>
                    <p className="text-sm text-white">{w.user.fullName || w.user.email}</p>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-white">{formatCurrency(Number(w.amount))}</TableCell>
                  <TableCell className="text-sm text-slate-300">{w.method}</TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-sm text-slate-400">{formatDate(w.requestedAt)}</TableCell>
                  <TableCell>
                    {w.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelected(w)}
                        className="text-amber-400"
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setNote(""); }}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Review Withdrawal</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Partner</p>
                  <p className="text-white">{selected.user.fullName || selected.user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400">Amount</p>
                  <p className="text-white font-semibold">{formatCurrency(Number(selected.amount))}</p>
                </div>
                <div>
                  <p className="text-slate-400">Method</p>
                  <p className="text-white">{selected.method}</p>
                </div>
                {selected.method === "BANK" ? (
                  <>
                    <div><p className="text-slate-400">Bank</p><p className="text-white">{selected.bankName}</p></div>
                    <div><p className="text-slate-400">Account</p><p className="text-white">{selected.accountNumber}</p></div>
                    <div><p className="text-slate-400">Holder</p><p className="text-white">{selected.accountHolder}</p></div>
                  </>
                ) : (
                  <>
                    <div><p className="text-slate-400">Wallet</p><p className="text-white break-all">{selected.walletAddress}</p></div>
                    <div><p className="text-slate-400">Crypto</p><p className="text-white">{selected.cryptoType} ({selected.cryptoNetwork})</p></div>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Admin Note (optional)</p>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                  placeholder="Add a note..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => processWithdrawal("APPROVED")}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  onClick={() => processWithdrawal("REJECTED")}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
