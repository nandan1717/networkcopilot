'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Loader2, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UpdatePassword({ onComplete }: { onComplete: () => void }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Password should be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccessMsg("Password updated successfully!");
            setTimeout(() => {
                onComplete();
            }, 1000);
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                {/* Decorative glows */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-900/40 rounded-full blur-[80px]"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 mb-4">
                            <KeyRound className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                            Set New Password
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-emerald-400 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="New Password"
                                    disabled={loading}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:bg-white/5 transition-all text-sm"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-emerald-400 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm New Password"
                                    disabled={loading}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:bg-white/5 transition-all text-sm"
                                />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                                {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center animate-in fade-in duration-300">
                                {successMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full py-3 px-4 rounded-xl flex items-center justify-center font-semibold transition-all duration-300",
                                loading
                                    ? "bg-emerald-500/50 text-white/50 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-[0.98]"
                            )}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
