"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WithdrawalForm } from "@/components/forms/withdrawal-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Withdrawal {
  id: string;
  amount: string;
  method: string;
  status: string;
  adminNote: string | null;
  requestedAt: string;
  processedAt: string | null;
}

interface WithdrawalsClientProps {
  withdrawals: Withdrawal[];
  availableBalance: number;
  minWithdrawal: number;
}

export function WithdrawalsClient({ withdrawals, availableBalance, minWithdrawal }: WithdrawalsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              <Plus className="mr-2 h-4 w-4" /> Request Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Request Withdrawal</DialogTitle>
            </DialogHeader>
            <WithdrawalForm
              availableBalance={availableBalance}
              minWithdrawal={minWithdrawal}
              onSuccess={() => { setOpen(false); router.refresh(); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Method</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Note</TableHead>
                <TableHead className="text-slate-400">Requested</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((w) => (
                <TableRow key={w.id} className="border-slate-700">
                  <TableCell className="text-sm font-medium text-white">{formatCurrency(Number(w.amount))}</TableCell>
                  <TableCell className="text-sm text-slate-300">{w.method === "BANK" ? "Bank Transfer" : "Crypto"}</TableCell>
                  <TableCell><StatusBadge status={w.status} /></TableCell>
                  <TableCell className="text-sm text-slate-400">{w.adminNote || "-"}</TableCell>
                  <TableCell className="text-sm text-slate-400">{formatDate(w.requestedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
