import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DollarSign, Lock, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PaymentFlowProps {
  jobId: number;
  workerId: string;
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
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  const handlePayDeposit = async () => {
    if (!user?.email) {
      toast.error("Please log in to continue");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create escrow if it doesn't exist
      let currentEscrow = escrow;
      if (!currentEscrow) {
        const result = await createEscrow.mutateAsync({
          jobId,
          workerId,
          totalAmount,
        });
        currentEscrow = result.escrow;
      }
      
      // Initialize Paystack payment
      const payment = await initializePayment.mutateAsync({
        amount: currentEscrow.depositAmount,
        email: user.email,
        reference: `khaya_${currentEscrow.id}_${Date.now()}`,
        metadata: {
          escrowId: currentEscrow.id,
          jobId,
          type: 'deposit',
        },
      });
      
      // Redirect to Paystack payment page
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
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
      deposit_paid: { label: "Deposit Paid", color: "bg-blue-100 text-blue-700" },
      held: { label: "In Escrow", color: "bg-yellow-100 text-yellow-700" },
      released: { label: "Released", color: "bg-green-100 text-green-700" },
      refunded: { label: "Refunded", color: "bg-red-100 text-red-700" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };
  
  if (!escrow) {
    // Calculate amounts with 5% buyer fee
    const buyerFee = Math.round(totalAmount * 0.05);
    const buyerTotal = totalAmount + buyerFee;
    const depositAmount = Math.round(buyerTotal * 0.3);
    const remainingAmount = buyerTotal - depositAmount;
    const workerFee = Math.round(totalAmount * 0.05);
    const workerReceives = totalAmount - workerFee;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Secure Payment
          </CardTitle>
          <CardDescription>
            Pay securely with escrow protection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job Amount:</span>
              <span className="font-semibold">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Fee (5%):</span>
              <span className="font-semibold">{formatPrice(buyerFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Your Total:</span>
              <span className="font-semibold text-lg">{formatPrice(buyerTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mt-4">
              <span className="text-muted-foreground">Deposit (30%):</span>
              <span className="font-semibold">{formatPrice(depositAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">On Completion (70%):</span>
              <span className="font-semibold">{formatPrice(remainingAmount)}</span>
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
              Worker receives: <span className="font-semibold text-foreground">{formatPrice(workerReceives)}</span>
              <span className="text-xs ml-1">(after 5% service fee)</span>
            </p>
          </div>
          
          <Button 
            onClick={handlePayDeposit} 
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? "Processing..." : `Pay Deposit ${formatPrice(depositAmount)}`}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Status
          </CardTitle>
          {getStatusBadge(escrow.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-semibold">{formatPrice(escrow.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deposit Paid:</span>
            <span className="font-semibold text-green-600">
              {formatPrice(escrow.depositAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Remaining:</span>
            <span className="font-semibold">{formatPrice(escrow.remainingAmount)}</span>
          </div>
        </div>
        
        {/* Payment Timeline */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-1 ${escrow.status !== 'pending' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {escrow.status !== 'pending' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">Deposit Payment</p>
              <p className="text-sm text-muted-foreground">
                {escrow.depositPaidAt 
                  ? `Paid on ${new Date(escrow.depositPaidAt).toLocaleDateString()}`
                  : 'Waiting for deposit payment'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-1 ${escrow.status === 'held' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              {escrow.status === 'held' ? (
                <Lock className="h-4 w-4 text-yellow-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">In Escrow</p>
              <p className="text-sm text-muted-foreground">
                {escrow.status === 'held' 
                  ? 'Funds held securely until job completion'
                  : 'Waiting for job to start'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className={`mt-1 rounded-full p-1 ${escrow.status === 'released' ? 'bg-green-100' : 'bg-gray-100'}`}>
              {escrow.status === 'released' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">Payment Released</p>
              <p className="text-sm text-muted-foreground">
                {escrow.releasedAt 
                  ? `Released on ${new Date(escrow.releasedAt).toLocaleDateString()}`
                  : 'Waiting for job completion and verification'}
              </p>
            </div>
          </div>
        </div>
        
        {escrow.status === 'pending' && (
          <Button 
            onClick={handlePayDeposit} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? "Processing..." : `Pay Deposit ${formatPrice(escrow.depositAmount)}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
