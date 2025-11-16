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
  const jobId = parseInt(params?.id || "0");
  const { data: job, isLoading } = trpc.job.getById.useQuery({ id: jobId });
  const { data: bids, refetch: refetchBids } = trpc.bid.getByJob.useQuery({ jobId });
  const { data: user } = trpc.auth.me.useQuery();
  const createBid = trpc.bid.create.useMutation();
  const generateProposal = trpc.ai.generateBidProposal.useMutation();
  
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [proposal, setProposal] = useState("");
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const acceptBid = trpc.bid.accept.useMutation();
  const { data: reviews, refetch: refetchReviews } = trpc.review.getByJob.useQuery({ jobId });
  
  const formatPrice = (cents: number) => `R${(cents / 100).toFixed(2)}`;
  
  const handleGenerateProposal = async () => {
    if (!bidAmount || !timeline) {
      toast.error("Please enter bid amount and timeline first");
      return;
    }
    
    toast.info("Generating proposal with AI...");
    
    generateProposal.mutate({
      jobTitle: job?.title || "",
      jobDescription: job?.description || "",
      bidAmount: parseFloat(bidAmount),
      timeline: `${timeline} days`,
    }, {
      onSuccess: (data) => {
        setProposal(data.proposal);
        toast.success("Proposal generated! Review and edit as needed.");
      },
      onError: () => {
        toast.error("Failed to generate proposal. Please try again.");
      },
    });
  };
  
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bidAmount || !timeline || !proposal) {
      toast.error("Please fill all fields");
      return;
    }
    
    createBid.mutate({
      jobId,
      amount: parseFloat(bidAmount),
      timeline: parseInt(timeline),
      proposal,
    }, {
      onSuccess: () => {
        toast.success("Bid submitted successfully!");
        setShowBidForm(false);
        setBidAmount("");
        setTimeline("");
        setProposal("");
        refetchBids();
      },
      onError: () => {
        toast.error("Failed to submit bid. Please try again.");
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
                  {!showBidForm ? (
                    <Button onClick={() => setShowBidForm(true)} className="w-full">
                      Place a Bid
                    </Button>
                  ) : (
                    <Button onClick={() => setShowBidForm(false)} variant="outline" className="w-full">
                      Cancel Bid
                    </Button>
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
                      disabled={generateProposal.isPending || !bidAmount || !timeline}
                      className="gap-2"
                    >
                      {generateProposal.isPending ? (
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
                    placeholder="Explain why you're the best fit for this job..."
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Generate with AI" to create a professional proposal, then edit as needed
                  </p>
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
                  <div key={item.bid.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{item.worker?.name || "Worker"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.bid.timeline} days · {formatPrice(item.bid.amount)}
                        </p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-sm capitalize px-2 py-1 bg-muted rounded">
                          {item.bid.status}
                        </span>
                        {user?.id === job.userId && item.bid.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBidId(item.bid.id);
                              setShowPayment(true);
                            }}
                          >
                            Accept & Pay
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                      {item.bid.proposal}
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
              workerId={bids?.find(b => b.bid.id === selectedBidId)?.bid.workerId?.toString() || ""}
              totalAmount={bids?.find(b => b.bid.id === selectedBidId)?.bid.amount || 0}
              onPaymentComplete={() => {
                setShowPayment(false);
                toast.success("Payment initiated successfully!");
                refetchBids();
              }}
            />
          </div>
        )}

        {/* Review Section */}
        {job.status === 'completed' && user?.id === job.userId && (
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
                workerId={job.workerId || 0}
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