import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PaymentFlow } from "@/components/PaymentFlow";
import ReviewForm from "@/components/ReviewForm";
import ReviewDisplay from "@/components/ReviewDisplay";
import { trpc } from "@/lib/trpc";
import { useRoute } from "wouter";
import { MapPin, DollarSign, Calendar, Sparkles, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = params?.id || "";
  const { data: job, isLoading } = trpc.job.getById.useQuery({ jobId });
  const { data: bids, refetch: refetchBids } = trpc.bid.getJobBids.useQuery({ jobId });
  const { data: user } = trpc.auth.me.useQuery();
  const createBid = trpc.bid.submit.useMutation();
  // const generateProposal = trpc.ai.generateBidProposal.useMutation(); // TODO: Add this endpoint
  
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [proposal, setProposal] = useState("");
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  
  const acceptBid = trpc.bid.accept.useMutation();
  // const { data: reviews, refetch: refetchReviews } = trpc.review.getByJob.useQuery({ jobId }); // TODO: Add review router
  const reviews = [];
  const refetchReviews = () => {};
  
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  const handleGenerateProposal = async () => {
    if (!bidAmount || !timeline) {
      toast.error("Please enter bid amount and timeline first");
      return;
    }
    
    setIsGeneratingProposal(true);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      // Temporary: Generate a simple template
      const simpleProposal = `I am interested in completing "${job?.title}". 

Based on the requirements, I propose to complete this work for R${bidAmount} within ${timeline} days.

I have experience in this type of work and will ensure quality results. Please let me know if you have any questions.`;
      
      setProposal(simpleProposal);
      setIsGeneratingProposal(false);
      toast.success("Template generated! Please customize it.");
    }, 500);
    
    // TODO: Add AI proposal generation endpoint
    /* generateProposal.mutate({
      jobTitle: job?.title || "",
      jobDescription: job?.description || "",
      bidAmount: parseFloat(bidAmount),
      timeline: `${timeline} days`,
    }, {
      onSuccess: (data) => {
        setProposal(data.proposal);
        setIsGeneratingProposal(false);
        toast.success("Proposal generated! Review and edit as needed.");
      },
      onError: () => {
        setIsGeneratingProposal(false);
        toast.error("Failed to generate proposal. Please try again.");
      },
    }); */
  };
  
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || !timeline || !proposal) {
      toast.error("Please fill all fields");
      return;
    }
    
    // Validate proposal length (backend requires min 50 characters)
    if (proposal.trim().length < 50) {
      toast.error("Proposal must be at least 50 characters long");
      return;
    }
    
    // Validate bid amount
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }
    
    createBid.mutate({
      jobId,
      amount: amount,
      proposedDuration: `${timeline} days`,
      coverLetter: proposal.trim(),
    }, {
      onSuccess: () => {
        toast.success("Bid submitted successfully!");
        setShowBidForm(false);
        setBidAmount("");
        setTimeline("");
        setProposal("");
        refetchBids();
      },
      onError: (error: any) => {
        const errorMessage = error?.message || "Failed to submit bid. Please try again.";
        toast.error(errorMessage);
      },
    });
  };
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!job) return <div className="min-h-screen flex items-center justify-center"><p>Job not found</p></div>;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-4xl">
        {/* Job Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{job.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatPrice(job.budget)}
                </span>
                <span className="capitalize">{job.status}</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Category</h3>
                <p className="text-muted-foreground">{job.category}</p>
              </div>
              
              {/* Place Bid Button */}
              {user && job.status === 'open' && (
                <div className="pt-4">
                  {user.userType === 'worker' ? (
                    !showBidForm ? (
                      <Button onClick={() => setShowBidForm(true)} className="w-full">
                        Place a Bid
                      </Button>
                    ) : (
                      <Button onClick={() => setShowBidForm(false)} variant="outline" className="w-full">
                        Cancel Bid
                      </Button>
                    )
                  ) : (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Only workers can place bids. Switch to a worker account to bid on this job.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bid Submission Form */}
        {showBidForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Submit Your Bid</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Bid Amount (R)</Label>
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="e.g., 500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label>Timeline (days)</Label>
                    <Input
                      type="number"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="e.g., 3"
                      min="1"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Proposal</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateProposal}
                      disabled={isGeneratingProposal || !bidAmount || !timeline}
                      className="gap-2"
                    >
                      {isGeneratingProposal ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    placeholder="Explain why you're the best fit for this job... (minimum 50 characters)"
                    rows={8}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      Click "Generate with AI" to create a professional proposal
                    </p>
                    <p className={`text-sm ${proposal.trim().length < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {proposal.trim().length}/50 characters
                    </p>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={createBid.isPending}
                  className="w-full"
                >
                  {createBid.isPending ? "Submitting..." : "Submit Bid"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Existing Bids */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bids ({bids?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {bids && bids.length > 0 ? (
              <div className="space-y-3">
                {bids.map(item => (
                  <div key={item.bidId} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.worker?.name || "Worker"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.proposedDuration} · {formatPrice(item.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm capitalize px-2 py-1 bg-muted rounded">
                          {item.status}
                        </span>
                        {user?.userId === job.clientId && item.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBidId(item.bidId);
                              setShowPayment(true);
                            }}
                          >
                            Accept & Pay
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                      {item.coverLetter}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No bids yet. Be the first to bid!</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Flow */}
        {showPayment && selectedBidId && (
          <div className="mb-6">
            <PaymentFlow
              jobId={jobId}
              workerId={bids?.find(b => b.bidId === selectedBidId)?.workerId?.toString() || ""}
              totalAmount={bids?.find(b => b.bidId === selectedBidId)?.amount || 0}
              onPaymentComplete={() => {
                setShowPayment(false);
                toast.success("Payment initiated successfully!");
                refetchBids();
              }}
            />
          </div>
        )}

        {/* Review Section */}
        {job.status === 'completed' && user?.userId === job.clientId && (
          <div className="mb-6">
            {!showReviewForm ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">Job Completed!</h3>
                    <p className="text-muted-foreground mb-4">
                      How was your experience? Leave a review to help others.
                    </p>
                    <Button onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ReviewForm
                jobId={jobId}
                workerId={job.assignedWorkerId || ""}
                onSuccess={() => {
                  setShowReviewForm(false);
                  refetchReviews();
                }}
              />
            )}
          </div>
        )}

        {/* Reviews Display */}
        {reviews && reviews.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            <ReviewDisplay reviews={reviews} />
          </div>
        )}
      </div>
    </div>
  );
}