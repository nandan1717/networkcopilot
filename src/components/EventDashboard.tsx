'use client';
import { useEffect, useState } from 'react';
import {
    Calendar, MapPin, Briefcase, ChevronDown, Clock, ThumbsUp, ThumbsDown,
    RefreshCw, Copy, Download, CalendarPlus, Mail, Check, Search, Users, Linkedin
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Filters } from './FilterPanel';

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
    key_people?: { name: string; role: string; company: string; linkedinUrl: string }[];
    ai_context?: {
        gpa: string;
        skills: string[];
        matchedSkills?: string[];
        customPrompt: string;
    };
    created_at: string;
}

type EventBatch = {
    batchTime: Date;
    events: MatchedEvent[];
}

type CommunitySentiment = {
    likes: number;
    dislikes: number;
    total: number;
    likePercent: number;
};

type DashboardProps = {
    refreshKey: number;
    session: any;
    feedback: Record<string, 'liked' | 'disliked'>;
    onFeedbackChange: (fb: Record<string, 'liked' | 'disliked'>) => void;
    filters: Filters;
    onRegenerate: () => void;
};

/** Group events into batches — events within 2 minutes of each other belong to the same batch */
function groupIntoBatches(events: MatchedEvent[]): EventBatch[] {
    if (events.length === 0) return [];
    const sorted = [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const batches: EventBatch[] = [];
    let currentBatch: MatchedEvent[] = [sorted[0]];
    let currentTime = new Date(sorted[0].created_at).getTime();

    for (let i = 1; i < sorted.length; i++) {
        const evTime = new Date(sorted[i].created_at).getTime();
        if (currentTime - evTime <= 2 * 60 * 1000) {
            currentBatch.push(sorted[i]);
        } else {
            batches.push({ batchTime: new Date(currentTime), events: currentBatch });
            currentBatch = [sorted[i]];
            currentTime = evTime;
        }
    }
    batches.push({ batchTime: new Date(currentTime), events: currentBatch });
    return batches;
}

/** Friendly relative time label */
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Generate .ics calendar file content */
function generateICS(ev: MatchedEvent): string {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    let dtStart = new Date(now.getTime() + 86400000);
    if (ev.date) {
        const parsed = new Date(ev.date);
        if (!isNaN(parsed.getTime())) dtStart = parsed;
    }
    const dtEnd = new Date(dtStart.getTime() + 2 * 3600000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//NetworkingPilot//EN',
        'BEGIN:VEVENT',
        `DTSTART:${fmt(dtStart)}`,
        `DTEND:${fmt(dtEnd)}`,
        `DTSTAMP:${stamp}`,
        `SUMMARY:${ev.eventName}`,
        `LOCATION:${ev.location}`,
        `DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}\\n\\nYour Pitch: ${ev.pitch.replace(/\n/g, '\\n')}`,
        `URL:${ev.link || ''}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');
}

/** Normalize event name for cross-user matching */
function normalizeEventName(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function EventDashboard({ refreshKey, session, feedback, onFeedbackChange, filters, onRegenerate }: DashboardProps) {
    const [events, setEvents] = useState<MatchedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [communityData, setCommunityData] = useState<Record<string, CommunitySentiment>>({});

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);

            if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'placeholder' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setErrorMsg('Supabase is not configured. Add your keys to .env.local to see matches.');
                setLoading(false);
                return;
            }

            // Small delay on re-fetch to let the API finish writing new events
            if (refreshKey > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            try {
                // Get current user to filter events
                const { data: { user } } = await supabase.auth.getUser();

                let query = supabase
                    .from('matched_events')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);

                // Only fetch this user's events
                if (user?.id) {
                    query = query.eq('user_id', user.id);
                }

                const { data, error } = await query;

                if (error) {
                    setErrorMsg(error.message);
                } else if (data) {
                    setEvents(data);
                    // Fetch community sentiment for these events
                    fetchCommunitySentiment(data.map((e: MatchedEvent) => e.eventName));
                }
            } catch (err: any) {
                setErrorMsg(err.message || 'Error fetching events');
            }
            setLoading(false);
        };

        fetchEvents();
    }, [refreshKey]);

    /** Fetch community sentiment data for a list of event names */
    const fetchCommunitySentiment = async (eventNames: string[]) => {
        try {
            const normalizedNames = [...new Set(eventNames.map(normalizeEventName))];
            const { data, error } = await supabase
                .from('event_reactions')
                .select('event_name_normalized, reaction')
                .in('event_name_normalized', normalizedNames);

            if (error || !data) return;

            // Aggregate reactions per event
            const agg: Record<string, { likes: number; dislikes: number }> = {};
            for (const row of data) {
                const key = row.event_name_normalized;
                if (!agg[key]) agg[key] = { likes: 0, dislikes: 0 };
                if (row.reaction === 'liked') agg[key].likes++;
                else agg[key].dislikes++;
            }

            const result: Record<string, CommunitySentiment> = {};
            for (const [key, val] of Object.entries(agg)) {
                const total = val.likes + val.dislikes;
                result[key] = {
                    likes: val.likes,
                    dislikes: val.dislikes,
                    total,
                    likePercent: total > 0 ? Math.round((val.likes / total) * 100) : 0,
                };
            }
            setCommunityData(result);
        } catch {
            // Silently fail — community data is non-critical
        }
    };

    /** Save a reaction to the database */
    const saveReaction = async (eventName: string, reaction: 'liked' | 'disliked') => {
        if (!session?.user?.id) return;
        const normalized = normalizeEventName(eventName);
        try {
            await supabase.from('event_reactions').upsert({
                user_id: session.user.id,
                event_name_normalized: normalized,
                event_name_original: eventName,
                reaction,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,event_name_normalized' });

            // Refresh community data
            fetchCommunitySentiment(events.map(e => e.eventName));
        } catch {
            // Silently fail
        }
    };

    const handleFeedback = (eventId: string, eventName: string, state: 'liked' | 'disliked') => {
        onFeedbackChange({ ...feedback, [eventId]: state });
        saveReaction(eventName, state);
    };

    const hasFeedback = Object.keys(feedback).length > 0;

    if (loading) {
        return (
            <div className="mt-8 sm:mt-12 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
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
            <div className="mt-8 sm:mt-12 space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-emerald-400" />
                    Your Recommended Events
                </h2>
                {errorMsg ? (
                    <div className="mt-8 text-center text-red-400 border border-red-900/50 rounded-2xl p-12 bg-red-900/10 backdrop-blur">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        {errorMsg}
                    </div>
                ) : (
                    <div className="mt-8 text-center border border-gray-800 border-dashed rounded-2xl p-8 sm:p-12 bg-gray-900/30 backdrop-blur">
                        <Search className="w-12 h-12 mx-auto mb-4 text-emerald-500/20" />
                        <p className="text-gray-400 font-medium mb-2">No events matched your criteria</p>
                        <p className="text-gray-600 text-sm max-w-md mx-auto">
                            Your filters might be too strict. Try expanding the location radius, widening the date range, or selecting a higher budget to discover more events.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const batches = groupIntoBatches(events);
    const latestBatch = batches[0];
    const historyBatches = batches.slice(1);
    const latestContext = latestBatch?.events[0]?.ai_context;

    return (
        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* AI Context Line */}
            {latestContext && (
                <p className="text-xs sm:text-sm text-gray-500 italic leading-relaxed">
                    AI matched using: GPA <span className="text-gray-400 not-italic font-medium">{latestContext.gpa || "N/A"}</span>
                    {(latestContext.skills || []).length > 0 && (
                        <> · Skills: <span className="text-gray-400 not-italic">{(latestContext.skills || []).join(", ")}</span></>
                    )}
                    {latestContext.customPrompt && latestContext.customPrompt !== "Standard Engine Match (No Override)" && (
                        <> · Prompt: <span className="text-gray-400 not-italic">"{latestContext.customPrompt}"</span></>
                    )}
                </p>
            )}

            {/* Regenerate Button */}
            {hasFeedback && (
                <div className="flex items-center">
                    <button
                        onClick={onRegenerate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer animate-in fade-in duration-300"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate with Feedback
                    </button>
                </div>
            )}

            {/* Latest Batch */}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-emerald-400" />
                Your Recommended Events
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {latestBatch.events.map((ev) => (
                    <EventCard
                        key={ev.id}
                        ev={ev}
                        feedbackState={feedback[ev.id] || null}
                        onFeedback={(state) => handleFeedback(ev.id, ev.eventName, state)}
                        sentiment={communityData[normalizeEventName(ev.eventName)] || null}
                    />
                ))}
            </div>

            {/* History Section */}
            {historyBatches.length > 0 && (
                <div className="mt-8 sm:mt-12 pt-6 border-t border-white/5">
                    <button
                        onClick={() => setHistoryOpen(!historyOpen)}
                        className="w-full flex items-center justify-between group cursor-pointer"
                    >
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-400 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-500" />
                            History
                            <span className="text-sm font-normal text-gray-600 ml-1">
                                ({historyBatches.reduce((sum, b) => sum + b.events.length, 0)} events)
                            </span>
                        </h2>
                        <ChevronDown
                            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${historyOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {historyOpen && (
                        <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                            {historyBatches.map((batch, i) => (
                                <div key={i}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap">
                                            Generated {formatRelativeTime(batch.batchTime)}
                                        </span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                    <div
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                                        style={{ filter: 'grayscale(100%)', opacity: 0.55 }}
                                    >
                                        {batch.events.map((ev) => (
                                            <EventCard key={ev.id} ev={ev} feedbackState={null} onFeedback={() => { }} sentiment={null} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function EventCard({ ev, feedbackState, onFeedback, sentiment }: {
    ev: MatchedEvent;
    feedbackState: 'liked' | 'disliked' | null;
    onFeedback: (state: 'liked' | 'disliked') => void;
    sentiment: CommunitySentiment | null;
}) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [copiedPitch, setCopiedPitch] = useState(false);

    const matchedSkills: string[] = ev.ai_context?.matchedSkills || [];

    const handleCopyPitch = async () => {
        await navigator.clipboard.writeText(ev.pitch);
        setCopiedPitch(true);
        setTimeout(() => setCopiedPitch(false), 2000);
    };

    const handleSaveNotes = () => {
        const text = [
            `Event: ${ev.eventName}`,
            `Location: ${ev.location}`,
            `Date: ${ev.date || 'TBD'} ${ev.time ? '• ' + ev.time : ''}`,
            `Price: ${ev.price || 'Not specified'}`,
            `Source: ${ev.source || 'N/A'}`,
            `Link: ${ev.link || 'N/A'}`,
            '',
            'Description:',
            ev.description || 'No description available.',
            '',
            'Your Custom Pitch:',
            ev.pitch,
        ].join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ev.eventName.replace(/[^a-zA-Z0-9]/g, '_')}_notes.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAddCalendar = () => {
        const ics = generateICS(ev);
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ev.eventName.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleEmailSelf = () => {
        const subject = encodeURIComponent(`Networking Event: ${ev.eventName}`);
        const body = encodeURIComponent([
            `Event: ${ev.eventName}`,
            `Location: ${ev.location}`,
            `Date: ${ev.date || 'TBD'} ${ev.time ? '• ' + ev.time : ''}`,
            `Price: ${ev.price || 'Not specified'}`,
            `Link: ${ev.link || 'N/A'}`,
            '',
            'Your Pitch:',
            ev.pitch,
        ].join('\n'));
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

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
                    <div className="relative h-full bg-[#0d1017] rounded-[15px] p-4 sm:p-6 flex flex-col border border-white/5 overflow-y-auto custom-scrollbar">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity text-emerald-500">
                            <Calendar className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                        </div>

                        {/* Source Badge + Event Name */}
                        <div className="flex flex-col items-start mb-4 gap-3">
                            {ev.source && (
                                <span className="inline-block max-w-full truncate text-[10px] uppercase tracking-wider font-bold bg-white/5 text-gray-400 px-2.5 py-1 rounded-full">
                                    {ev.source}
                                </span>
                            )}
                            <h3 className="text-lg sm:text-xl font-semibold text-white leading-tight">{ev.eventName}</h3>
                        </div>

                        {/* Location + Date */}
                        <div className="space-y-3 mb-5">
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

                        {/* Pitch */}
                        <div className="flex-1">
                            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">Your Custom Pitch</p>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-gray-300 text-sm leading-relaxed italic border-l-2 border-l-emerald-500 group-hover:bg-emerald-500/10 transition-colors mb-4">
                                &ldquo;{ev.pitch}&rdquo;
                            </div>
                        </div>

                        {/* Feedback + View Details */}
                        <div className="mt-auto">
                            <div className="flex items-center gap-2 mb-3">
                                <button
                                    onClick={() => onFeedback('liked')}
                                    className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer ${feedbackState === 'liked'
                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-emerald-400 hover:border-emerald-500/30'
                                        }`}
                                    title="Like this event"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onFeedback('disliked')}
                                    className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer ${feedbackState === 'disliked'
                                        ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/30'
                                        }`}
                                    title="Dislike this event"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                                <div className="flex-1" />
                                <button
                                    onClick={handleCopyPitch}
                                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-500 hover:text-emerald-400 hover:border-emerald-500/30 transition-all cursor-pointer"
                                    title="Copy pitch"
                                >
                                    {copiedPitch ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            <button
                                onClick={() => setIsFlipped(true)}
                                className="block text-center w-full bg-white/5 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold py-3 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer"
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
                    <div className="relative h-full bg-[#0d1017] rounded-[15px] p-4 sm:p-6 flex flex-col border border-white/5">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10 shrink-0">
                            <h3 className="text-lg font-bold text-white leading-tight truncate pr-4">{ev.eventName}</h3>
                            <button
                                onClick={() => setIsFlipped(false)}
                                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full px-3 py-1 text-xs uppercase tracking-wider font-bold cursor-pointer shrink-0"
                            >
                                Back
                            </button>
                        </div>

                        {/* Scrollable content area */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar min-h-0">
                            {/* Description */}
                            <div>
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">About The Event</h4>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {ev.description || "No detailed description available for this event."}
                                </p>
                            </div>

                            {/* Matched Skills */}
                            {matchedSkills.length > 0 && (
                                <div>
                                    <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">Matched Skills</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {matchedSkills.map((skill, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 rounded-full"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Key People */}
                            {(ev.key_people || []).length > 0 && (
                                <div>
                                    <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">People to Connect With</h4>
                                    <div className="space-y-2">
                                        {(ev.key_people || []).map((person, i) => (
                                            <a
                                                key={i}
                                                href={person.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group/person"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                                    <Linkedin className="w-4 h-4 text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate group-hover/person:text-blue-400 transition-colors">
                                                        {person.name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 truncate">
                                                        {person.role}{person.company ? ` · ${person.company}` : ''}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] text-blue-400/60 font-medium shrink-0 opacity-0 group-hover/person:opacity-100 transition-opacity">
                                                    View →
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price */}
                            <div>
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">Cost / Price</h4>
                                <div className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm">
                                    {ev.price || (ev.ai_context as any)?.price || "Not specified"}
                                </div>
                            </div>

                            {/* Community Rating */}
                            {sentiment && sentiment.total >= 1 && (
                                <div>
                                    <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-2">Community Rating</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                                style={{ width: `${sentiment.likePercent}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-emerald-400 tabular-nums min-w-[3rem] text-right">
                                            {sentiment.likePercent}%
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1.5">
                                        {sentiment.likes} 👍 · {sentiment.dislikes} 👎 · {sentiment.total} total ratings
                                    </p>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div>
                                <h4 className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mb-3">Quick Actions</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleCopyPitch}
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                                    >
                                        {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedPitch ? 'Copied!' : 'Copy Pitch'}
                                    </button>
                                    <button
                                        onClick={handleSaveNotes}
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Save Notes
                                    </button>
                                    <button
                                        onClick={handleAddCalendar}
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                                    >
                                        <CalendarPlus className="w-3.5 h-3.5" />
                                        Add to Cal
                                    </button>
                                    <button
                                        onClick={handleEmailSelf}
                                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                                    >
                                        <Mail className="w-3.5 h-3.5" />
                                        Email Me
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Fixed bottom: Event Link */}
                        <div className="mt-4 pt-3 border-t border-white/10 shrink-0">
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
