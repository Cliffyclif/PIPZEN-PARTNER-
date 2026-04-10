import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCommissionsPage() {
  const commissions = await prisma.commission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      earner: { select: { id: true, fullName: true, email: true } },
      buyer: { select: { id: true, fullName: true, email: true } },
      purchase: { select: { packageName: true, amount: true } },
    },
  });

  const totalPaid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);
  const totalPending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + Number(c.commissionAmount), 0);

  return (
    <div>
      <PageHeader title="Commissions" description="View all commission records" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Total Commissions</p>
            <p className="text-2xl font-bold text-white">{commissions.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Commission Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Earner</TableHead>
                <TableHead className="text-slate-400">Buyer</TableHead>
                <TableHead className="text-slate-400">Level</TableHead>
                <TableHead className="text-slate-400">Rate</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c) => (
                <TableRow key={c.id} className="border-slate-700">
                  <TableCell>
                    <p className="text-sm text-white">{c.earner.fullName || c.earner.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-300">{c.buyer.fullName || c.buyer.email}</p>
                  </TableCell>
                  <TableCell className="text-sm text-slate-300">Level {c.level}</TableCell>
                  <TableCell className="text-sm text-slate-300">{Number(c.rate)}%</TableCell>
                  <TableCell className="text-sm font-medium text-emerald-400">
                    {formatCurrency(Number(c.commissionAmount))}
                  </TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-sm text-slate-400">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
