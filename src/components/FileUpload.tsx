'use client';
import { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle2, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export function FileUpload({ onSuccess, session }: { onSuccess: () => void, session: any }) {
    const [isHovering, setIsHovering] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsHovering(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
        if (droppedFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles]);
        }
    }, []);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []).filter(f => f.type === 'application/pdf');
        if (selectedFiles.length > 0) {
            setFiles(prev => [...prev, ...selectedFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const processFiles = async () => {
        if (files.length === 0) return;
        setStatus('uploading');
        setErrorMessage('');

        try {
            // Convert all files to Base64 Promises
            const base64Promises = files.map(file => {
                return new Promise<{ fileName: string, fileBase64: string }>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => {
                        const base64String = reader.result as string;
                        resolve({
                            fileName: file.name,
                            fileBase64: base64String.split(',')[1]
                        });
                    };
                    reader.onerror = error => reject(error);
                });
            });

            const base64Files = await Promise.all(base64Promises);
            setStatus('processing');

            // Fetch a fresh access token to avoid stale token errors
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession?.access_token) {
                throw new Error('Your session has expired. Please log in again.');
            }

            const res = await fetch('/api/match', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentSession.access_token}`
                },
                body: JSON.stringify({
                    files: base64Files,
                    customPrompt: customPrompt,
                    userTimeContext: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    userLocationContext: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (res.status === 401) {
                    throw new Error('Your session has expired. Please log in again.');
                }
                throw new Error(errorData.error || 'Failed to process matching engine');
            }

            setStatus('success');
            setFiles([]);
            setCustomPrompt('');
            onSuccess();

            // Revert back to idle after a few seconds of celebration
            setTimeout(() => setStatus('idle'), 3000);

        } catch (err: any) {
            console.error(err);
            setErrorMessage(err.message || 'Error processing files.');
            setStatus('error');
        }
    }

    return (
        <div className="w-full">
            {/* Unified Upload & Chatbar Widget */}
            <div
                id="tour-upload-zone"
                className={cn(
                    "relative rounded-3xl border-2 transition-all duration-300 ease-in-out bg-white/5 backdrop-blur-sm overflow-hidden",
                    isHovering ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.15)]" : "border-gray-500/20 hover:border-gray-500/40 hover:bg-white/10",
                    status === 'success' && "border-emerald-500/50 bg-emerald-500/5"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsHovering(true); }}
                onDragLeave={() => setIsHovering(false)}
                onDrop={onDrop}
            >
                {/* Drag & Drop Zone Context */}
                <div className="p-4 sm:p-8">
                    <input type="file" accept=".pdf" multiple className="hidden" id="file-upload" onChange={onChange} disabled={status === 'uploading' || status === 'processing'} />
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer space-y-4">
                        {status === 'idle' || status === 'error' ? (
                            <div className="p-4 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                            </div>
                        ) : status === 'success' ? (
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        ) : (
                            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                        )}

                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-300 pb-1">
                                {status === 'idle' && "Drag & Drop PDF Resumes"}
                                {status === 'uploading' && "Uploading files..."}
                                {status === 'processing' && "AI is analyzing your profile..."}
                                {status === 'success' && "Matches Found!"}
                                {status === 'error' && "Error processing files"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {status === 'idle' && "Click to browse multiple files"}
                                {status === 'error' && <span className="text-red-400 font-medium block mt-1">{errorMessage}</span>}
                            </p>
                        </div>
                    </label>
                </div>

                {/* Custom Prompt Context */}
                <div id="tour-custom-prompt" className="relative group border-t border-white/5 p-2 bg-black/10">
                    <div className="absolute top-6 left-6 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Customize your networking goals... (e.g. 'I am looking for early-stage AI startups hiring founding engineers.')"
                        className="w-full bg-transparent border-none focus:ring-0 p-4 pl-14 text-sm text-gray-300 placeholder:text-gray-500 outline-none resize-none transition-all h-16 sm:h-20"
                        disabled={status === 'uploading' || status === 'processing'}
                    />
                </div>
            </div>

            {/* Selected Files List & Action Button - Renders OUTSIDE and BELOW the unified box */}
            {files.length > 0 && status === 'idle' && (
                <div className="flex flex-col gap-4 mt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex flex-wrap gap-2">
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-sm text-emerald-400 shadow-sm">
                                <FileText className="w-4 h-4" />
                                <span className="truncate max-w-[150px] font-medium">{file.name}</span>
                                <button onClick={() => removeFile(i)} className="text-emerald-500/50 hover:text-red-400 transition-colors ml-2 p-0.5 hover:bg-red-400/10 rounded-full">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={processFiles}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3 sm:py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        Initialize AI Matching Engine
                    </button>
                </div>
            )}
        </div>
    );
}
