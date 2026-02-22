'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, User, Briefcase, GraduationCap, Code2, Award, MapPin, Mail, Phone, Linkedin, Github, Globe, HeartHandshake, FolderGit2, RefreshCw, FileText } from 'lucide-react';

type UserProfileData = {
    name?: string;
    avatar_url?: string;
    address?: string;
    contact?: {
        email?: string;
        phone?: string;
        linkedin?: string;
        github?: string;
        website?: string;
    };
    gpa: string;
    skills: string[];
    summary: string;
    education: {
        school: string;
        degree: string;
        duration: string;
    }[];
    experiences: {
        role: string;
        company: string;
        duration: string;
        metrics: string[];
    }[];
    projects: {
        title: string;
        techStack: string[];
        description: string[];
    }[];
    volunteer: {
        role: string;
        organization: string;
        duration: string;
        description: string;
    }[];
    raw_resume?: string[];
};

const highlightNumbers = (text: string) => {
    if (!text) return text;
    const parts = text.split(/([\+\$]?\d+(?:[\.,]\d+)?(?:k|K|M|B|%)?)/g);
    return parts.map((part, i) => {
        if (/^[\+\$]?\d+(?:[\.,]\d+)?(?:k|K|M|B|%)?$/.test(part)) {
            return <strong key={i} className="text-emerald-400 font-bold">{part}</strong>;
        }
        return part;
    });
};

export function UserProfile({ session, refreshKey, isOpen, onClose }: { session: any, refreshKey: number, isOpen: boolean, onClose: () => void }) {
    const [profile, setProfile] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [viewMode, setViewMode] = useState<'profile' | 'resume'>('profile');

    const fetchProfile = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        // --- Performance: Exclude raw_resume from initial fetch ---
        const { data, error } = await supabase
            .from('user_profiles')
            .select('name, avatar_url, address, contact, gpa, skills, summary, education, experiences, projects, volunteer')
            .eq('id', session.user.id)
            .single();

        if (data) {
            setProfile({
                name: data.name,
                avatar_url: data.avatar_url,
                address: data.address,
                contact: data.contact || {},
                gpa: data.gpa,
                skills: data.skills || [],
                summary: data.summary,
                education: data.education || [],
                experiences: data.experiences || [],
                projects: data.projects || [],
                volunteer: data.volunteer || [],
                raw_resume: [] // loaded lazily
            });
        }
        setLoading(false);
    };

    // --- Performance: Lazy-load raw_resume only when Resume tab is selected ---
    const fetchResume = async () => {
        if (!session?.user?.id) return;
        const { data } = await supabase
            .from('user_profiles')
            .select('raw_resume')
            .eq('id', session.user.id)
            .single();
        if (data?.raw_resume) {
            setProfile(prev => prev ? { ...prev, raw_resume: data.raw_resume } : null);
        }
    };

    const handleSyncProfile = async () => {
        if (!session?.access_token) return;
        setSyncing(true);
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!res.ok) throw new Error('Failed to sync profile');
            // Re-fetch the newly generated profile
            await fetchProfile();
        } catch (error) {
            console.error("Sync error:", error);
            alert("Failed to sync profile. Ensure you have a resume stored first.");
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [session, refreshKey]);

    // Trigger lazy resume fetch when switching to resume view
    useEffect(() => {
        if (viewMode === 'resume' && profile && (!profile.raw_resume || profile.raw_resume.length === 0)) {
            fetchResume();
        }
    }, [viewMode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-gray-900/90 to-black/90 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 hide-scrollbar">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                >
                    <X className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="w-full h-64 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 mb-4 animate-pulse">
                            <User className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 tracking-wide animate-pulse">Loading Profile...</h3>
                    </div>
                ) : !profile ? (
                    <div className="w-full h-64 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center border border-white/5 mb-4">
                            <User className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Profile Found</h3>
                        <p className="text-gray-400 text-sm max-w-sm">
                            Upload your resume or transcript on the dashboard to automatically generate your AI-powered professional profile!
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-6 px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Header Banner */}
                        <div className="h-32 bg-gradient-to-r from-emerald-600/30 to-teal-900/30 border-b border-white/5 relative">
                            <div className="absolute -bottom-12 left-8 p-1.5 rounded-full bg-[#050505]">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                    <User className="w-12 h-12 text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        <div className="px-8 pt-16 pb-8 space-y-10">
                            {/* Intro Section */}
                            <div>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{profile.name || session.user.email}</h2>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center p-1 bg-black/40 border border-white/5 rounded-full">
                                            <button
                                                onClick={() => setViewMode('profile')}
                                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'profile' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                Extraction
                                            </button>
                                            <button
                                                onClick={() => setViewMode('resume')}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === 'resume' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                <FileText className="w-3.5 h-3.5" /> Resume
                                            </button>
                                        </div>

                                        <button
                                            onClick={handleSyncProfile}
                                            disabled={syncing}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full font-medium text-sm transition-all shadow-sm"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                            {syncing ? 'Syncing...' : 'Sync Profile'}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mb-5 text-sm">
                                    <span className="text-emerald-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                                        <Award className="w-4 h-4" /> AI Networker
                                    </span>
                                    {profile.address && (
                                        <span className="text-gray-400 flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4" /> {profile.address}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-300 leading-relaxed text-[15px] max-w-4xl">{highlightNumbers(profile.summary)}</p>
                            </div>

                            {viewMode === 'resume' ? (
                                <div className="w-full h-[600px] bg-black/40 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center">
                                    {profile.raw_resume && profile.raw_resume.length > 0 ? (
                                        <iframe
                                            src={`data:application/pdf;base64,${profile.raw_resume[0]}#toolbar=0`}
                                            className="w-full h-full"
                                            title="Original Resume Preview"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <FileText className="w-12 h-12 text-gray-700" />
                                            <p className="text-sm text-gray-500 italic">No original resume file found.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {/* Contact Info Bar */}
                                    {profile.contact && Object.keys(profile.contact).length > 0 && (
                                        <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 animate-in slide-in-from-bottom-2 duration-300">
                                            {profile.contact.email && (
                                                <a href={`mailto:${profile.contact.email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                                                    <Mail className="w-4 h-4" /> {profile.contact.email}
                                                </a>
                                            )}
                                            {profile.contact.phone && (
                                                <a href={`tel:${profile.contact.phone}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                                                    <Phone className="w-4 h-4" /> {profile.contact.phone}
                                                </a>
                                            )}
                                            {profile.contact.linkedin && (
                                                <a href={profile.contact.linkedin.startsWith('http') ? profile.contact.linkedin : `https://${profile.contact.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                                                    <Linkedin className="w-4 h-4" /> {profile.contact.linkedin.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                            {profile.contact.github && (
                                                <a href={profile.contact.github.startsWith('http') ? profile.contact.github : `https://${profile.contact.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                                                    <Github className="w-4 h-4" /> {profile.contact.github.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                            {profile.contact.website && (
                                                <a href={profile.contact.website.startsWith('http') ? profile.contact.website : `https://${profile.contact.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
                                                    <Globe className="w-4 h-4" /> {profile.contact.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column: Skills, Education, Volunteer */}
                                        <div className="space-y-8">
                                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4 flex items-center gap-2">
                                                    <Code2 className="w-4 h-4 text-emerald-500" /> Core Skills
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {profile.skills.map((skill, idx) => (
                                                        <span key={idx} className="bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-emerald-300">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Education section */}
                                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                                <div className="flex items-center justify-between mb-5">
                                                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 flex items-center gap-2">
                                                        <GraduationCap className="w-4 h-4 text-emerald-500" /> Education
                                                    </h3>
                                                    {profile.gpa && (
                                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                                                            GPA: {profile.gpa}
                                                        </span>
                                                    )}
                                                </div>

                                                {profile.education.length > 0 ? (
                                                    <div className="space-y-5">
                                                        {profile.education.map((edu, i) => (
                                                            <div key={i}>
                                                                <h4 className="font-bold text-white text-[15px]">{edu.school}</h4>
                                                                <div className="flex justify-between items-center mt-1">
                                                                    <p className="text-sm text-gray-400">{edu.degree}</p>
                                                                    <span className="text-[10px] text-gray-500 font-medium">{edu.duration}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No education history extracted.</p>
                                                )}
                                            </div>

                                            {/* Volunteer section */}
                                            {profile.volunteer.length > 0 && (
                                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-5 flex items-center gap-2">
                                                        <HeartHandshake className="w-4 h-4 text-emerald-500" /> Volunteer Experience
                                                    </h3>
                                                    <div className="space-y-5">
                                                        {profile.volunteer.map((vol, i) => (
                                                            <div key={i}>
                                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                                    <h4 className="font-bold text-white text-[14px]">{vol.role}</h4>
                                                                    <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">{vol.duration}</span>
                                                                </div>
                                                                <p className="text-sm text-emerald-500/80 mb-2 font-medium">{vol.organization}</p>
                                                                {vol.description && (
                                                                    <p className="text-xs text-gray-400 leading-relaxed">{highlightNumbers(vol.description)}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column: Experience & Projects */}
                                        <div className="space-y-8">
                                            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                                <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-5 flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-emerald-500" /> Extracted Experience
                                                </h3>
                                                {profile.experiences.length > 0 ? (
                                                    <div className="space-y-6">
                                                        {profile.experiences.map((exp, i) => (
                                                            <div key={i} className="relative pl-4 border-l-2 border-white/10 hover:border-emerald-500/50 transition-colors">
                                                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#050505] border-2 border-emerald-500/50" />
                                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                                    <h4 className="font-bold text-white text-[15px]">{exp.role}</h4>
                                                                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">{exp.duration}</span>
                                                                </div>
                                                                <p className="text-sm text-emerald-500/80 mb-3 font-medium">{exp.company}</p>
                                                                <ul className="space-y-2">
                                                                    {(exp.metrics || []).map((metric, idx) => (
                                                                        <li key={idx} className="text-xs text-gray-400 leading-relaxed flex items-start gap-2">
                                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500/40 shrink-0" />
                                                                            <span>{highlightNumbers(metric)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic text-center py-8">No formal experiences extracted.</p>
                                                )}
                                            </div>

                                            {/* Projects section */}
                                            {profile.projects.length > 0 && (
                                                <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                                    <h3 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-5 flex items-center gap-2">
                                                        <FolderGit2 className="w-4 h-4 text-emerald-500" /> Notable Projects
                                                    </h3>
                                                    <div className="space-y-6">
                                                        {profile.projects.map((proj, i) => (
                                                            <div key={i} className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors">
                                                                <h4 className="font-bold text-white text-[15px] mb-3">{proj.title}</h4>

                                                                {proj.techStack && proj.techStack.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                                        {proj.techStack.map((tech, idx) => (
                                                                            <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium text-emerald-400">
                                                                                {tech}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                <ul className="space-y-1.5">
                                                                    {(proj.description || []).map((desc, idx) => (
                                                                        <li key={idx} className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
                                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                                                                            <span>{highlightNumbers(desc)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
