import React from "react";

/**
 * FlyonStepperShell
 * - Responsive: horizontal stepper on small screens, vertical on md+
 * - Gold step circles (active/completed)
 * - Strong Next/Prev buttons with hover/active styles
 */
export default function FlyonStepperShell({
  steps,
  currentStep, // 1-based
  onPrev,
  onNext,
  onFinish,
  onStepClick, // Optional callback for step navigation
  canGoPrev = true,
  canGoNext = true,
  isFinal = false,
  submitting = false,
  children,
}) {
  return (
    <div
      className="mt-20 bg-base-100 flex w-full items-start gap-8 rounded-lg p-4 shadow-sm max-sm:flex-col"
      id="wizard-validation"
    >
      {/* Stepper Nav */}
      <ul
        className="
          relative flex flex-col gap-y-2
          max-sm:flex-row max-sm:gap-y-0 max-sm:gap-x-3
          max-sm:w-full max-sm:overflow-x-auto max-sm:pb-2
        "
        aria-label="Steps"
      >
        {steps.map((label, idx) => {
          const stepIndex = idx + 1;
          const isActive = stepIndex === currentStep;
          const isCompleted = stepIndex < currentStep;

          // Gold palette (no plugin needed)
          const circleClass = isActive
            ? "bg-amber-500 text-white ring-4 ring-amber-200"
            : isCompleted
            ? "bg-amber-400 text-white ring-2 ring-amber-200"
            : "bg-base-200 text-base-content/70 ring-1 ring-base-300";

          const labelClass = isActive
            ? "opacity-100"
            : isCompleted
            ? "opacity-90"
            : "opacity-70";

          return (
            <li
              key={`${label}-${stepIndex}`}
              className="
                group flex flex-1 flex-col items-center
                max-sm:flex-row max-sm:items-center max-sm:flex-none
              "
            >
              <button
                type="button"
                onClick={() => onStepClick?.(stepIndex)}
                disabled={submitting}
                className="
                  min-h-7.5 inline-flex flex-col items-center gap-2 align-middle text-sm
                  max-sm:flex-row max-sm:gap-2
                  cursor-pointer hover:opacity-80 transition-opacity
                  disabled:cursor-not-allowed disabled:opacity-50
                  focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 rounded-lg
                "
              >
                <span
                  className={`
                    flex size-8 shrink-0 items-center justify-center rounded-full font-semibold
                    transition-all duration-200 ${circleClass}
                  `}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span className="text-sm">{stepIndex}</span>
                </span>

                <span
                  className={`text-base-content whitespace-nowrap font-medium transition-opacity ${labelClass}`}
                >
                  {label}
                </span>
              </button>

              {/* Connector: vertical on md+, horizontal on small */}
              <div
                className={`
                  mt-2 h-8 w-px group-last:hidden bg-base-content/20
                  ${isCompleted ? "bg-amber-400" : "bg-base-content/20"}
                  max-sm:mt-0 max-sm:ml-3 max-sm:h-px max-sm:w-8
                `}
              />
            </li>
          );
        })}
      </ul>
      {/* End Stepper Nav */}

      {/* Stepper Content */}
      <div className="w-full p-3">
        {children}

        {/* Button Group */}
        <div className="mt-6 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-stretch">
          {/* Base button styling (Tailwind only, reliable everywhere) */}
          <button
            type="button"
            onClick={onPrev}
            disabled={!canGoPrev || currentStep === 1 || submitting}
            className="
              inline-flex items-center justify-center gap-2
              rounded-lg px-4 py-2 text-sm font-semibold
              border border-base-300 bg-base-100 text-base-content
              shadow-sm
              transition
              hover:bg-base-200 hover:shadow
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
              max-sm:w-full
            "
          >
            {/* Use plain text arrow so it never “disappears” */}
            <span aria-hidden="true">←</span>
            <span>Previous</span>
          </button>

          {!isFinal ? (
            <button
              type="button"
              onClick={onNext}
              disabled={!canGoNext || submitting}
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg px-4 py-2 text-sm font-semibold
                bg-amber-500 text-white
                shadow-sm
                transition
                hover:bg-amber-600 hover:shadow
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                max-sm:w-full
              "
            >
              <span>{submitting ? "Please wait..." : "Next"}</span>
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              disabled={submitting}
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg px-4 py-2 text-sm font-semibold
                bg-amber-500 text-white
                shadow-sm
                transition
                hover:bg-amber-600 hover:shadow
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                max-sm:w-full
              "
            >
              {submitting ? "Submitting..." : "Finish"}
            </button>
          )}
        </div>
      </div>
      {/* End Stepper Content */}
    </div>
  );
}
