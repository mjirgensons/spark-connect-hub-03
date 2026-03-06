import { Check } from "lucide-react";

const steps = ["Information", "Review & Pay"];

interface CheckoutStepperProps {
  currentStep: number;
}

const CheckoutStepper = ({ currentStep }: CheckoutStepperProps) => {
  return (
    <div className="flex items-center w-full max-w-lg mx-auto mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = currentStep > stepNum;
        const isCurrent = currentStep === stepNum;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 border-2 border-foreground flex items-center justify-center text-sm font-mono font-bold transition-colors ${
                  isCompleted
                    ? "bg-foreground text-background"
                    : isCurrent
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-[10px] sm:text-xs mt-1 font-medium whitespace-nowrap ${
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{stepNum}</span>
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-1rem] ${
                  currentStep > stepNum ? "bg-foreground" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutStepper;
