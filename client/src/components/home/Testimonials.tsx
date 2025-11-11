import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export const Testimonials = () => {
  const testimonials = [
    {
      rating: 5,
      quote: "I needed my bathroom fixed urgently. Posted the job, got 4 bids within hours, and hired someone who finished in 2 days. Amazing!",
      name: "Thandi K.",
      role: "Homeowner, Pietermaritzburg",
      initial: "T",
      jobDetail: "Job: Bathroom Plumbing Repair"
    },
    {
      rating: 5,
      quote: "I've landed 12 jobs in 2 months through Project Khaya. The bidding system is fair and payments are always on time.",
      name: "Sipho M.",
      role: "Electrician, Durban",
      initial: "S",
      jobDetail: "12 jobs completed | R45,000 earned"
    },
    {
      rating: 5,
      quote: "Project Khaya connects me directly with customers who need materials. My sales have tripled since joining.",
      name: "Ben's Hardware",
      role: "Supplier, Mooi River",
      initial: "B",
      jobDetail: "Sales tripled in 3 months"
    }
  ];

  return (
    <section className="py-20 bg-background" aria-labelledby="testimonials">
      <div className="container">
        <div className="text-center mb-16">
          <h2 id="testimonials" className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Real Stories, Real Results
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hear from homeowners, workers, and suppliers who've found success on Project Khaya.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:shadow-elegant transition-all duration-300 group">
              <CardContent className="pt-6 pb-6 md:pt-8 md:pb-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed italic text-sm md:text-base">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-lg md:text-xl flex-shrink-0">
                    {testimonial.initial}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm md:text-base">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-primary font-semibold">
                    {testimonial.jobDetail}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
