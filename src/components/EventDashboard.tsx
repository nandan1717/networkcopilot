'use client';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type MatchedEvent = {
    id: string;
    eventName: string;
    location: string;
    description?: string;
    pitch: string;
    date: string | null;
    time: string | null;
    link: string | null;
    source: string | null;
    price?: string | null;
    ai_context?: {
        gpa: string;
        skills: string[];
        customPrompt: string;
    };
    created_at: string;
}

export function EventDashboard({ refreshKey, session }: { refreshKey: number, session: any }) {
    const [events, setEvents] = useState<MatchedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);

            // Prevent fetching if Supabase isn't configured yet
            if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'placeholder' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setErrorMsg('Supabase is not configured. Add your keys to .env.local to see matches.');
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('matched_events')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(12);

                if (error) {
                    setErrorMsg(error.message);
                } else if (data) {
                    setEvents(data);
                }
            } catch (err: any) {
                setErrorMsg(err.message || 'Error fetching events');
            }
            setLoading(false);
        };

        fetchEvents();
    }, [refreshKey]);

    if (loading) {
        return (
            <div className="mt-12 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                    Your Recommended Events
                </h2>
                <div className="mt-8 text-center text-gray-400 animate-pulse bg-gray-900/40 p-12 rounded-2xl border border-gray-800">
                    Loading matches...
                </div>
            </div>
        );
    }

    if (errorMsg || events.length === 0) {
        return (
            <div className="mt-12 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                    Your Recommended Events
                </h2>
                {errorMsg ? (
                    <div className="mt-8 text-center text-red-400 border border-red-900/50 rounded-2xl p-12 bg-red-900/10 backdrop-blur">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        {errorMsg}
                    </div>
                ) : (
                    <div className="mt-8 text-center text-gray-500 border border-gray-800 border-dashed rounded-2xl p-12 bg-gray-900/30 backdrop-blur">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        No events matched yet. Upload your resume to start.
                    </div>
                )}
            </div>
        );
    }

    const latestContext = events[0]?.ai_context;

    return (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* AI Context Banner */}
            {latestContext && (
                <div className="mb-10 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-2xl p-6 shadow-lg backdrop-blur-md">
                    <h3 className="text-sm uppercase tracking-widest font-bold text-emerald-400 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        AI Match Context
                    </h3>
                    <p className="text-gray-300 leading-relaxed text-[15px]">
                        Based on your profile, we extracted a GPA of <span className="text-emerald-400 font-bold">{latestContext.gpa || "N/A"}</span> and core skills in <span className="text-emerald-400 font-bold">{(latestContext.skills || []).join(", ") || "various disciplines"}</span>.
                        {latestContext.customPrompt && latestContext.customPrompt !== "Standard Engine Match (No Override)" && (
                            <> You also added the following custom matching instructions: <span className="text-emerald-400 font-bold italic">"{latestContext.customPrompt}"</span>.</>
                        )}
                        {" "}We used this context to search for and curate the personalized networking events below.
                    </p>
                </div>
            )}

            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-emerald-400" />
                Your Recommended Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ev) => (
                    <EventCard key={ev.id} ev={ev} />
                ))}
            </div>
        </div>
    );
}

function EventCard({ ev }: { ev: MatchedEvent }) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div style={{ perspective: '1200px' }} className="w-full h-full">
            <div
                className="relative w-full h-full transition-transform duration-700"
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
                {/* Front Side */}
                <div
                    className="w-full h-full group relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800/80 to-gray-900/80 p-[1px] shadow-xl hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-300"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-full bg-[#0d1017] rounded-[15px] p-6 flex flex-col pt-8 border border-white/5">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity text-emerald-500">
                            <Calendar className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                        </div>
                        <div className="flex flex-col items-start mb-4 gap-3">
                            {ev.source && (
                                <span className="inline-block max-w-full truncate text-[10px] uppercase tracking-wider font-bold bg-white/5 text-gray-400 px-2.5 py-1 rounded-full">
                                    {ev.source}
                                </span>
                            )}
                            <h3 className="text-xl font-semibold text-white leading-tight">{ev.eventName}</h3>
                        </div>
                        {ev.description && (
                            <p className="text-sm text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                                {ev.description}
                            </p>
                        )}

                        <div className="space-y-3 mb-6 flex-1">
                            <div className="flex items-start text-emerald-400/80 text-sm font-medium gap-2">
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="flex-1">{ev.location}</span>
                            </div>
                            {ev.date && (
                                <div className="flex items-start text-gray-400 text-sm gap-2">
                                    <Calendar className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span className="flex-1">{ev.date} {ev.time && `• ${ev.time}`}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto">
                            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">Your Custom Pitch</p>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-gray-300 text-sm leading-relaxed italic border-l-2 border-l-emerald-500 group-hover:bg-emerald-500/10 transition-colors mb-4">
                                "{ev.pitch}"
                            </div>
                            <button
                                onClick={() => setIsFlipped(true)}
                                className="block text-center w-full bg-white/5 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold py-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all"
                            >
                                View Event Details
                            </button>
                        </div>
                    </div>
                </div>

                {/* Back Side */}
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-900/50 to-gray-900/90 p-[1px] shadow-xl"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                    <div className="relative h-full bg-[#0d1017] rounded-[15px] p-6 flex flex-col pt-8 border border-white/5">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                            <h3 className="text-lg font-bold text-white leading-tight truncate pr-4">Event Overview</h3>
                            <button
                                onClick={() => setIsFlipped(false)}
                                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full px-3 py-1 text-xs uppercase tracking-wider font-bold"
                            >
                                Back
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                            <div>
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">About The Event</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {ev.description || "No detailed description available for this event."}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">Cost / Price</h4>
                                <div className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm">
                                    {ev.price || (ev.ai_context as any)?.price || "Not specified"}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10">
                            {ev.link ? (
                                <a
                                    href={ev.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-center w-full bg-emerald-500 hover:bg-emerald-400 text-gray-900 text-sm font-bold py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                                >
                                    Open Official Event Link
                                </a>
                            ) : (
                                <div className="text-center w-full bg-white/5 text-gray-500 text-sm font-semibold py-3 rounded-xl">
                                    No Link Available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
