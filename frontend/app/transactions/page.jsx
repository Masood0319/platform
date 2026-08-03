"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const startupInfo = {
  name: "Aurora Mobility",
  industry: "Clean Transportation",
  stage: "Series A",
  founder: "Renee Carter",
  equityOffered: "4.5%",
};

const transactions = [
  {
    id: "TXN12345",
    startup: "AI Health Diagnostics",
    amount: 10000,
    method: "Credit/Debit Card",
    status: "Completed",
    date: "Feb 12, 2026",
  },
  {
    id: "TXN12892",
    startup: "Orbit Logistics",
    amount: 25000,
    method: "Bank Transfer",
    status: "Pending",
    date: "Feb 28, 2026",
  },
  {
    id: "TXN12977",
    startup: "ClearWater Analytics",
    amount: 15000,
    method: "Wallet",
    status: "Completed",
    date: "Mar 3, 2026",
  },
  {
    id: "TXN13001",
    startup: "NeuroRoute",
    amount: 8000,
    method: "Credit/Debit Card",
    status: "Failed",
    date: "Mar 7, 2026",
  },
  {
    id: "TXN13044",
    startup: "Lumen Robotics",
    amount: 42000,
    method: "Bank Transfer",
    status: "Completed",
    date: "Mar 9, 2026",
  },
];

const feeRate = 0.02;

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function TransactionCard({ amount, fee, total }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 top-6 h-32 w-32 rounded-full bg-[var(--surface)] opacity-60 blur-2xl" />
      <div className="pointer-events-none absolute -left-10 bottom-6 h-32 w-32 rounded-full bg-[#d4e6ff] opacity-50 blur-2xl" />
      <CardTitle>Transaction summary</CardTitle>
      <CardDescription className="mt-1">Preview what will be charged before confirming.</CardDescription>
      <div className="mt-5 space-y-4 text-sm">
        <SummaryRow label="Startup" value={startupInfo.name} />
        <SummaryRow label="Investment amount" value={formatCurrency(amount)} />
        <SummaryRow label="Platform fee" value={formatCurrency(fee)} />
        <div className="border-t border-dashed border-[var(--border)] pt-4">
          <SummaryRow label="Total payment" value={formatCurrency(total)} strong />
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--text-muted)]">
        Funds are held in escrow until the investment agreement is executed. Estimated processing time: 1-2 business days.
      </div>
    </Card>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className={cn("text-[var(--text-muted)]", strong && "text-[var(--text-main)] font-semibold")}>{label}</p>
      <p className={cn("text-[var(--text-main)]", strong && "text-lg font-semibold")}>{value}</p>
    </div>
  );
}

function PaymentForm({ hidden }) {
  if (hidden) return null;

  return (
    <Card>
      <CardTitle>Card payment</CardTitle>
      <CardDescription className="mt-1">Use a saved card or enter new details.</CardDescription>
      <div className="mt-5 grid gap-4">
        <Input placeholder="Cardholder name" />
        <Input placeholder="Card number" />
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Expiry date" />
          <Input placeholder="CVV" />
        </div>
      </div>
      <Button className="mt-5 w-full">Complete payment</Button>
    </Card>
  );
}

function CheckoutForm({
  amount,
  onAmountChange,
  method,
  onMethodChange,
  fee,
  total,
}) {
  return (
    <Card>
      <CardTitle>Investment checkout</CardTitle>
      <CardDescription className="mt-1">Review startup details and confirm your investment.</CardDescription>

      <div className="mt-6 grid gap-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Startup information</p>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <InfoItem label="Startup name" value={startupInfo.name} />
            <InfoItem label="Industry" value={startupInfo.industry} />
            <InfoItem label="Funding stage" value={startupInfo.stage} />
            <InfoItem label="Founder" value={startupInfo.founder} />
          </div>
        </div>

        <div className="grid gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Investment details</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Investment amount</label>
              <Input
                className="mt-2"
                value={amount}
                onChange={(event) => onAmountChange(event.target.value)}
                placeholder="$10,000"
              />
            </div>
            <InfoItem label="Equity offered" value={startupInfo.equityOffered} />
            <InfoItem label="Platform fee" value={formatCurrency(fee)} />
            <InfoItem label="Total payment" value={formatCurrency(total)} />
          </div>
        </div>

        <div className="grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Payment method</p>
          <select
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
            value={method}
            onChange={(event) => onMethodChange(event.target.value)}
          >
            <option value="card">Credit/Debit Card</option>
            <option value="bank">Bank Transfer</option>
            <option value="wallet">Wallet</option>
          </select>
          <div className="flex flex-wrap gap-3">
            <Button className="min-w-[160px]">Confirm investment</Button>
            <Button variant="ghost" className="min-w-[120px]">Cancel</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{value}</p>
    </div>
  );
}

function TransactionTable({ rows }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription className="mt-1">Track completed, pending, and failed payments.</CardDescription>
        </div>
        <Badge>Updated Mar 11, 2026</Badge>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="pb-3">Transaction ID</th>
              <th className="pb-3">Startup</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Payment method</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Date</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <TransactionRow key={row.id} transaction={row} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TransactionRow({ transaction }) {
  const statusStyles = {
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Failed: "border-rose-200 bg-rose-50 text-rose-700",
  }[transaction.status];

  return (
    <tr className="text-[var(--text-main)]">
      <td className="py-4 font-semibold">{transaction.id}</td>
      <td className="py-4">{transaction.startup}</td>
      <td className="py-4 font-semibold">{formatCurrency(transaction.amount)}</td>
      <td className="py-4">{transaction.method}</td>
      <td className="py-4">
        <Badge className={cn("border", statusStyles)}>{transaction.status}</Badge>
      </td>
      <td className="py-4">{transaction.date}</td>
      <td className="py-4 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost">View details</Button>
          <Button size="sm" variant="outline">Download receipt</Button>
        </div>
      </td>
    </tr>
  );
}

export default function TransactionsPage() {
  const [amount, setAmount] = React.useState("10000");
  const [method, setMethod] = React.useState("card");

  const amountValue = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const fee = Math.round(amountValue * feeRate);
  const total = amountValue + fee;

  return (
    <AppShell
      title="Transactions & Checkout"
      subtitle="Review investments and track your transactions."
    >
      <div className="max-w-full space-y-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Transactions</Badge>
          <span className="text-xs text-[var(--text-muted)]">Updated Mar 11, 2026</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-6">
            <CheckoutForm
              amount={amount}
              onAmountChange={setAmount}
              method={method}
              onMethodChange={setMethod}
              fee={fee}
              total={total}
            />
            <PaymentForm hidden={method !== "card"} />
          </div>
          <div className="grid gap-6">
            <TransactionCard amount={amountValue} fee={fee} total={total} />
            <Card>
              <CardTitle>Compliance check</CardTitle>
              <CardDescription className="mt-1">Stay aligned with AML and investor suitability rules.</CardDescription>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <span>Investor accreditation</span>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Verified</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                  <span>Risk disclosure signed</span>
                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">Pending</Badge>
                </div>
              </div>
              <Button variant="outline" className="mt-5 w-full">Review disclosures</Button>
            </Card>
          </div>
        </div>

        <TransactionTable rows={transactions} />
      </div>
    </AppShell>
  );
}
