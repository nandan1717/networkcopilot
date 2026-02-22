'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, X } from 'lucide-react';

type Step = {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
};

const steps: Step[] = [
    {
        targetId: 'tour-upload-zone',
        title: 'Upload Profile',
        description: 'Drag and drop your resume or transcript here to generate your AI profile.',
        position: 'bottom'
    },
    {
        targetId: 'tour-custom-prompt',
        title: 'Direct the Match Engine',
        description: 'Need something specific? Tell the AI what kind of events, companies, or people you are looking for.',
        position: 'bottom'
    },
    {
        targetId: 'tour-profile-btn',
        title: 'Your Vibe Profile',
        description: 'Click here to view your extracted profile, skills, and sync new data without losing old events.',
        position: 'bottom'
    }
];

export function UITour({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const updateTargetRect = () => {
        const target = document.getElementById(steps[currentStep].targetId);
        if (target) {
            setTargetRect(target.getBoundingClientRect());
            // Smooth scroll to element if not fully in view
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setTargetRect(null);
        }
    };

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);

        // Small delay to ensure DOM is fully rendered before grabbing rects
        const timeout = setTimeout(updateTargetRect, 200);
        return () => {
            window.removeEventListener('resize', updateTargetRect);
            clearTimeout(timeout);
        };
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    if (!targetRect) return null;

    const step = steps[currentStep];

    // Calculate Popover Position
    let popoverStyle: React.CSSProperties = {};
    const margin = 12;
    const popoverWidth = typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 320;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

    if (step.position === 'bottom') {
        const idealLeft = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        popoverStyle = {
            top: targetRect.bottom + margin,
            left: Math.min(Math.max(margin, idealLeft), viewportWidth - popoverWidth - margin),
        };
    } else if (step.position === 'top') {
        const idealLeft = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
        popoverStyle = {
            top: targetRect.top - margin - 150,
            left: Math.min(Math.max(margin, idealLeft), viewportWidth - popoverWidth - margin),
        };
    }

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Dark Overlay with cutout */}
            <div
                className="absolute inset-0 bg-[#050505]/70 backdrop-blur-[3px] pointer-events-auto transition-all duration-500"
                style={{
                    clipPath: `polygon(
                        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
                        ${targetRect.left - 8}px ${targetRect.top - 8}px,
                        ${targetRect.right + 8}px ${targetRect.top - 8}px,
                        ${targetRect.right + 8}px ${targetRect.bottom + 8}px,
                        ${targetRect.left - 8}px ${targetRect.bottom + 8}px,
                        ${targetRect.left - 8}px ${targetRect.top - 8}px
                    )`
                }}
            />

            {/* Glowing Border around Target */}
            <div
                className="absolute rounded-xl border border-emerald-400 bg-emerald-400/10 shadow-[0_0_20px_rgba(16,185,129,0.3)] pointer-events-none transition-all duration-500 ease-out z-[101]"
                style={{
                    top: targetRect.top - 8,
                    left: targetRect.left - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                }}
            />

            <div
                className="absolute w-[280px] sm:w-[320px] bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] shadow-2xl pointer-events-auto transition-all duration-500 ease-out z-[102] animate-in fade-in zoom-in-95 overflow-hidden"
                style={popoverStyle}
            >
                {/* Subtle internal glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none" />
                <button
                    onClick={onComplete}
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <h3 className="text-lg font-bold text-white mb-2 pr-6">
                    {step.title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                    {step.description}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all",
                                    idx === currentStep ? "bg-emerald-400 w-3" : "bg-white/20"
                                )}
                            />
                        ))}
                    </div>
                    <button
                        onClick={handleNext}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 z-10 relative"
                    >
                        {currentStep === steps.length - 1 ? 'Got it' : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
