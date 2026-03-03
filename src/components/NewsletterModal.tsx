'use client';
import { Mail, X } from 'lucide-react';

interface NewsletterModalProps {
    isOpen: boolean;
    onSubscribe: () => void;
    onSkip: () => void;
}

export function NewsletterModal({ isOpen, onSubscribe, onSkip }: NewsletterModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px]"></div>

                <div className="relative z-10 p-6 sm:p-8">
                    <div className="flex flex-col items-center text-center space-y-5">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Mail className="w-8 h-8 text-emerald-400" />
                        </div>

                        {/* Title */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-2">Stay in the Loop</h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Get weekly updates on top networking events, career tips, and new features delivered to your inbox.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col w-full gap-3 pt-2">
                            <button
                                onClick={onSubscribe}
                                className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Mail className="w-4 h-4" />
                                Subscribe to Newsletter
                            </button>
                            <button
                                onClick={onSkip}
                                className="w-full py-2.5 px-4 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
                            >
                                Skip for now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
