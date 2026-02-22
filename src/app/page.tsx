'use client';
import { useEffect, useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { EventDashboard } from '@/components/EventDashboard';
import { UserProfile } from '@/components/UserProfile';
import { Auth } from '@/components/Auth';
import { Tutorial } from '@/components/Tutorial';
import { UITour } from '@/components/UITour';
import { UpdatePassword } from '@/components/UpdatePassword';
import { supabase } from '@/lib/supabase';
import { LogOut, User, HelpCircle } from 'lucide-react';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Phase 1: Pre-login modal guide
  const [showGuide, setShowGuide] = useState(false);
  // Phase 2: Post-login UI highlighter
  const [showTour, setShowTour] = useState(false);
  // Phase 3: Password Recovery
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  useEffect(() => {
    // Check pre-login guide state
    if (!localStorage.getItem('guideComplete')) {
      setShowGuide(true);
    }

    // Handle PKCE code exchange from password recovery link
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code) {
      // Clean the code from the URL to avoid re-processing on refresh
      url.searchParams.delete('code');
      window.history.replaceState({}, '', url.pathname + url.search);

      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Error exchanging code for session:', error.message);
        }
        // The onAuthStateChange listener below will handle the PASSWORD_RECOVERY event
      });
    }

    const loadProfileData = (userId: string) => {
      supabase.from('user_profiles').select('name, avatar_url').eq('id', userId).single()
        .then(({ data }) => {
          if (data?.name) setProfileName(data.name.split(' ')[0]); // Grab first name
          if (data?.avatar_url) setProfileAvatar(data.avatar_url);
        });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        loadProfileData(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user?.id) {
        loadProfileData(session.user.id);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Monitor session changes to reliably trigger the UI Tour post-login
  useEffect(() => {
    if (session && !localStorage.getItem('tourComplete')) {
      setShowTour(true);
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

      {/* Glow Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-800/10 blur-[120px] pointer-events-none"></div>

      <main className="max-w-5xl mx-auto px-6 py-20 md:py-32 relative z-10 flex flex-col items-center">
        {session && (
          <div className="absolute top-8 right-6 flex items-center gap-4 z-50">
            <button
              onClick={() => {
                localStorage.removeItem('guideComplete');
                localStorage.removeItem('tourComplete');
                setShowGuide(true);
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-400 transition-colors bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
            <button
              id="tour-profile-btn"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-400 transition-colors bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 text-gray-500 hover:text-red-400 transition-colors bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        <header className="mb-16 text-center w-full max-w-3xl border-b border-white/5 pb-12">
          <div className="inline-flex items-center justify-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium tracking-wide shadow-lg shadow-emerald-900/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {session ? (profileName ? `Welcome back, ${profileName}` : 'Welcome AI Networker') : 'Global Networking Hub'}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Networking <span className="text-emerald-500 drop-shadow-lg">Co-Pilot</span>
          </h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed">
            Upload your resume or transcript. We'll extract your skills and match you with top professional networking events in your area, complete with custom pitches.
          </p>
        </header>

        {loading ? (
          <div className="animate-pulse text-emerald-500 font-medium tracking-widest text-sm uppercase">Loading Authentication...</div>
        ) : !session ? (
          showGuide ? (
            <Tutorial onComplete={() => {
              localStorage.setItem('guideComplete', 'true');
              setShowGuide(false);
            }} />
          ) : (
            <section className="w-full z-20 relative animate-in fade-in duration-500">
              <Auth onLogin={() => { }} />
            </section>
          )
        ) : isRecoveringPassword ? (
          <section className="w-full z-20 relative animate-in fade-in duration-500 mt-12">
            <UpdatePassword onComplete={() => setIsRecoveringPassword(false)} />
          </section>
        ) : (
          <div className="w-full flex flex-col items-center gap-12">
            {showGuide && (
              <Tutorial onComplete={() => {
                localStorage.setItem('guideComplete', 'true');
                setShowGuide(false);
                setShowTour(true);
              }} />
            )}
            {showTour && !showGuide && (
              <UITour onComplete={() => {
                localStorage.setItem('tourComplete', 'true');
                setShowTour(false);
              }} />
            )}
            <UserProfile
              session={session}
              refreshKey={refreshKey}
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
            />

            <section className="w-full max-w-2xl z-20 relative">
              <FileUpload onSuccess={() => setRefreshKey(prev => prev + 1)} session={session} />
            </section>

            <section className="w-full z-10">
              <EventDashboard refreshKey={refreshKey} session={session} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
