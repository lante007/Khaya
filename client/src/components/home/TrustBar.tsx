import { Shield, CreditCard, Award, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

const useCounter = (target: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

export const TrustBar = () => {
  const jobsCompleted = useCounter(1500);

  return (
    <section className="bg-trust border-y border-border py-8" aria-labelledby="trust-stats">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-secondary" aria-hidden="true" />
              <span className="text-2xl font-bold text-foreground">500+</span>
            </div>
            <span className="text-sm text-muted-foreground">Verified Professionals</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-secondary" aria-hidden="true" />
              <span className="text-2xl font-bold text-foreground">R2.1M+</span>
            </div>
            <span className="text-sm text-muted-foreground">Securely Processed</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-secondary" aria-hidden="true" />
              <span className="text-2xl font-bold text-foreground">98%</span>
            </div>
            <span className="text-sm text-muted-foreground">Satisfaction Rate</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
              <span className="text-2xl font-bold text-foreground">{jobsCompleted.toLocaleString()}+</span>
            </div>
            <span className="text-sm text-muted-foreground">Jobs Completed</span>
          </div>
        </div>
      </div>
    </section>
  );
};
