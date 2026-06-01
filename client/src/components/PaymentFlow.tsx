import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, Lock, CheckCircle, Clock } from "lucide-react";

interface PaymentFlowProps {
  jobId: number;
  workerId: number;
  totalAmount: number;
  onPaymentComplete?: () => void;
}

export function PaymentFlow({ jobId, workerId, totalAmount, onPaymentComplete }: PaymentFlowProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: escrowData } = trpc.escrow.getByJobId.useQuery({ jobId });
  const createEscrow = trpc.escrow.create.useMutation();
  const initializePayment = trpc.paystack.initializePayment.useMutation();
  const { data: user } = trpc.auth.me.useQuery();

  const escrow = escrowData?.escrow;

  const parseAmount = (v: string | number | null | undefined) =>
    v == null ? 0 : typeof v === "number" ? v : parseFloat(v);

  const fmt = (rands: number) => `R${rands.toFixed(2)}`;

  // Fee preview (before escrow is created)
  const buyerFee = Math.round(totalAmount * 0.05 * 100) / 100;
  const buyerTotal = totalAmount + buyerFee;
  const depositAmount = Math.round(buyerTotal * 0.3 * 100) / 100;
  const remainingAmount = Math.round((buyerTotal - depositAmount) * 100) / 100;
  const workerReceives = Math.round(totalAmount * 0.95 * 100) / 100;

  const handlePayDeposit = async () => {
    if (!user?.email) { toast.error("Please log in to continue"); return; }
    setIsProcessing(true);
    try {
      let escrowId: number;
      if (!escrow) {
        const result = await createEscrow.mutateAsync({ jobId, workerId, totalAmount });
        escrowId = result.escrowId;
      } else {
        escrowId = escrow.id;
      }

      const depositKobo = Math.round(depositAmount * 100);
      const reference = `khaya_${escrowId}_${Date.now()}`;

      const payment = await initializePayment.mutateAsync({
        amount: depositKobo,
        email: user.email ?? "",
        reference,
        metadata: { escrowId, jobId, type: "deposit" },
      });

      if (payment.data.authorization_url) {
        window.location.href = payment.data.authorization_url;
      }
    } catch (error) {
      toast.error("Failed to initialize payment");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending:      { label: "Pending",      className: "bg-gray-100 text-gray-700" },
      deposit_paid: { label: "Deposit Paid", className: "bg-blue-100 text-blue-700" },
      held:         { label: "In Escrow",    className: "bg-yellow-100 text-yellow-700" },
      funded:       { label: "Funded",       className: "bg-blue-100 text-blue-700" },
      released:     { label: "Released",     className: "bg-green-100 text-green-700" },
      refunded:     { label: "Refunded",     className: "bg-red-100 text-red-700" },
      disputed:     { label: "Disputed",     className: "bg-orange-100 text-orange-700" },
    };
    const cfg = map[status] ?? map.pending;
    return <Badge className={cfg.className}>{cfg.label}</Badge>;
  };

  if (!escrow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Payment
          </CardTitle>
          <CardDescription>Pay securely with escrow protection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job Amount:</span>
              <span className="font-semibold">{fmt(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee (5%):</span>
              <span className="font-semibold">{fmt(buyerFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Your Total:</span>
              <span className="font-semibold text-lg">{fmt(buyerTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mt-4">
              <span className="text-muted-foreground">Deposit (30%):</span>
              <span className="font-semibold">{fmt(depositAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">On Completion (70%):</span>
              <span className="font-semibold">{fmt(remainingAmount)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              How Escrow Works
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pay 30% deposit to start the job</li>
              <li>• Funds held securely in escrow</li>
              <li>• Worker completes the job</li>
              <li>• You verify and approve</li>
              <li>• Remaining 70% released to worker</li>
            </ul>
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm">
            <p className="text-muted-foreground">
              Worker receives:{" "}
              <span className="font-semibold text-foreground">{fmt(workerReceives)}</span>
              <span className="text-xs ml-1">(after 5% service fee)</span>
            </p>
          </div>

          <Button onClick={handlePayDeposit} disabled={isProcessing} className="w-full" size="lg">
            {isProcessing ? "Processing…" : `Pay Deposit ${fmt(depositAmount)}`}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Escrow exists — show status
  const escrowBuyerTotal = parseAmount(escrow.buyerTotal);
  const escrowDeposit = Math.round(escrowBuyerTotal * 0.3 * 100) / 100;
  const escrowRemaining = Math.round((escrowBuyerTotal - escrowDeposit) * 100) / 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Status
          </CardTitle>
          {statusBadge(escrow.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-semibold">{fmt(escrowBuyerTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit (30%):</span>
            <span className="font-semibold text-green-600">{fmt(escrowDeposit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining (70%):</span>
            <span className="font-semibold">{fmt(escrowRemaining)}</span>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          {[
            {
              done: escrow.status !== "pending",
              label: "Deposit Payment",
              detail: escrow.status !== "pending" ? "Deposit paid" : "Waiting for deposit",
            },
            {
              done: escrow.status === "held" || escrow.status === "funded",
              label: "In Escrow",
              detail:
                escrow.status === "held" || escrow.status === "funded"
                  ? "Funds held securely"
                  : "Waiting for job to start",
            },
            {
              done: escrow.status === "released",
              label: "Payment Released",
              detail: escrow.releasedAt
                ? `Released on ${new Date(escrow.releasedAt).toLocaleDateString()}`
                : "Waiting for job completion",
            },
          ].map(({ done, label, detail }) => (
            <div key={label} className="flex items-start gap-3">
              <div className={`mt-1 rounded-full p-1 ${done ? "bg-green-100" : "bg-gray-100"}`}>
                {done ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        {escrow.status === "pending" && (
          <Button onClick={handlePayDeposit} disabled={isProcessing} className="w-full">
            {isProcessing ? "Processing…" : `Pay Deposit ${fmt(escrowDeposit)}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
