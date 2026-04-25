"use client";

import { TestStep, TestRunStep } from "@/lib/supabase/types";
import { StepCard } from "./step-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StepProgressProps {
  steps: TestStep[];
  runSteps: TestRunStep[];
}

export function StepProgress({ steps, runSteps }: StepProgressProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-2.5 space-y-0.5">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            runStep={runSteps[index]}
            index={index}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
