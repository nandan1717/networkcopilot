'use client';
import { useState } from 'react';
import { ChevronRight, Sparkles, Target, Zap, CheckCircle2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Tutorial({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Networking Co-Pilot",
            description: "Your personalized AI strategist. We help you find the exact rooms you need to be in, anywhere in the world.",
            icon: <Sparkles className="w-12 h-12 text-emerald-400" />,
            glow: "bg-emerald-500/20"
        },
        {
            title: "Instant Profile Generation",
            description: "Just drag & drop your resume. Our AI instantly extracts your core skills, experiences, and career trajectory.",
            icon: <Bot className="w-12 h-12 text-teal-400" />,
            glow: "bg-teal-500/20"
        },
        {
            title: "Custom Search Directives",
            description: "Looking for early-stage startups? Or established corporate firms? Use the chatbar to give the matching engine highly specific instructions.",
            icon: <Target className="w-12 h-12 text-blue-400" />,
            glow: "bg-blue-500/20"
        },
        {
            title: "Curated Events & Pitches",
            description: "We scrape live events to match your exact profile, and generate a custom 2-sentence pitch for you to use when networking.",
            icon: <Zap className="w-12 h-12 text-yellow-400" />,
            glow: "bg-yellow-500/20"
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/90 backdrop-blur-xl animate-in fade-in duration-500 p-4 sm:p-6">
            <div className="relative w-full max-w-2xl bg-gradient-to-b from-gray-900/90 to-black/90 rounded-[2rem] border border-white/10 shadow-2xl p-6 sm:p-8 md:p-12 overflow-hidden flex flex-col min-h-[400px] sm:min-h-[500px]">

                {/* Background Glows */}
                <div className={cn("absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] transition-colors duration-1000", steps[currentStep].glow)} />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-900/40 rounded-full blur-[100px]" />

                {/* Progress Indicators */}
                <div className="flex gap-2 justify-center mb-8 sm:mb-12 relative z-10">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                idx === currentStep ? "w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "w-2 bg-white/20"
                            )}
                        />
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 slide-in-from-right-8 animate-in duration-500">
                    <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl inline-flex animate-bounce-subtle">
                        {currentStep === 0 ? (
                            <img src="/icon.png?v=3" alt="Logo" className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        ) : (
                            steps[currentStep].icon
                        )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight">
                        {steps[currentStep].title}
                    </h2>
                    <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-md mx-auto">
                        {steps[currentStep].description}
                    </p>
                </div>

                {/* Navigation Footer */}
                <div className="mt-8 sm:mt-12 flex items-center justify-between relative z-10">
                    <button
                        onClick={onComplete}
                        className="text-gray-500 hover:text-white transition-colors text-sm font-medium px-4 py-2"
                    >
                        Skip Tutorial
                    </button>

                    <button
                        onClick={handleNext}
                        className={cn(
                            "flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold transition-all duration-300 shadow-lg active:scale-95 text-sm sm:text-base",
                            currentStep === steps.length - 1
                                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/20"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/5"
                        )}
                    >
                        {currentStep === steps.length - 1 ? (
                            <>Get Started <CheckCircle2 className="w-5 h-5" /></>
                        ) : (
                            <>Next Step <ChevronRight className="w-5 h-5" /></>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
