'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, Loader2, UserPlus, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Auth({ onLogin }: { onLogin: () => void }) {
    const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (mode === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else if (mode === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/api/auth/callback`,
                });
                if (error) throw error;
                setSuccessMsg('Password reset link sent! Check your email.');
                setLoading(false);
                return; // Don't check session if we just requested a reset
            }

            // Check if we actually have a session now for signin/signup
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                onLogin();
            } else if (mode === 'signup') {
                setSuccessMsg('Signup successful! Check your email to confirm your account.');
            }
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
                            {mode === 'signup' ? <UserPlus className="w-6 h-6 text-emerald-400" /> : <LogIn className="w-6 h-6 text-emerald-400" />}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                            {mode === 'signup' ? 'Create an Account' : mode === 'forgot_password' ? 'Reset Password' : 'Welcome Back'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {mode === 'signup' ? 'Join the network and discover events.' : mode === 'forgot_password' ? 'Enter your email to receive a reset link.' : 'Sign in to access your dashboard.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-emerald-400 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email address"
                                    disabled={loading}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:bg-white/5 transition-all text-sm"
                                />
                            </div>

                            {mode !== 'forgot_password' && (
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-emerald-400 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        disabled={loading}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none focus:border-emerald-500/50 focus:bg-white/5 transition-all text-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                                {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center">
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
                                mode === 'signup' ? 'Sign Up' : mode === 'forgot_password' ? 'Send Reset Link' : 'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col items-center gap-2 text-center text-sm">
                        {mode === 'signin' && (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('forgot_password');
                                    setErrorMsg('');
                                    setSuccessMsg('');
                                }}
                                className="text-gray-400 hover:text-emerald-400 transition-colors"
                            >
                                Forgot password?
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === 'signup' ? 'signin' : 'signup');
                                setErrorMsg('');
                                setSuccessMsg('');
                            }}
                            className="text-gray-400 hover:text-emerald-400 transition-colors mt-2"
                        >
                            {mode === 'signup'
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
