'use client';
import { useEffect, useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { EventDashboard } from '@/components/EventDashboard';
import { UserProfile } from '@/components/UserProfile';
import { Auth } from '@/components/Auth';
import { Tutorial } from '@/components/Tutorial';
import { UITour } from '@/components/UITour';
import { UpdatePassword } from '@/components/UpdatePassword';
import { TermsModal } from '@/components/TermsModal';
import { NewsletterModal } from '@/components/NewsletterModal';
import { supabase } from '@/lib/supabase';
import { User, HelpCircle } from 'lucide-react';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);


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

      supabase.auth.exchangeCodeForSession(code).then(({ error }: { error: any }) => {
        if (error) {
          console.error('Error exchanging code for session:', error.message);
        }
        // The onAuthStateChange listener below will handle the PASSWORD_RECOVERY event
      });
    }

    const loadProfileData = (userId: string) => {
      supabase.from('user_profiles').select('name, avatar_url, terms_accepted, newsletter_subscribed').eq('id', userId).single()
        .then(({ data }: { data: any }) => {
          if (data?.name) setProfileName(data.name.split(' ')[0]);
          if (data?.avatar_url) setProfileAvatar(data.avatar_url);
          if (data?.terms_accepted) {
            setTermsAccepted(true);
          } else {
            setTermsAccepted(false);
            setShowTermsModal(true);
          }
        })
        .catch(() => {
          // No profile row yet — need terms acceptance
          setTermsAccepted(false);
          setShowTermsModal(true);
        });
    };

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setSession(session);
      if (session?.user?.id) {
        loadProfileData(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSession(session);
      if (session?.user?.id) {
        loadProfileData(session.user.id);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }
      // If token refresh failed, session becomes null — sign out gracefully
      if (event === 'TOKEN_REFRESHED' && !session) {
        supabase.auth.signOut();
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfileName(null);
        setProfileAvatar(null);
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

      <main className={`max-w-5xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center safe-top ${session ? 'py-16 md:py-32' : 'min-h-screen justify-center'}`}>
        {session && (
          <div className="w-full flex items-center justify-center relative pt-4 sm:pt-8 mb-4 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs sm:text-sm font-medium tracking-wide shadow-lg shadow-emerald-900/20 pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {profileName ? `Welcome back, ${profileName}` : 'Welcome AI Networker'}
            </div>
            <div className="absolute right-0 top-4 sm:top-8 flex items-center gap-2 sm:gap-3 z-50 pointer-events-auto">
              <button
                onClick={() => {
                  localStorage.removeItem('guideComplete');
                  localStorage.removeItem('tourComplete');
                  setShowGuide(true);
                }}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-emerald-400 transition-colors bg-white/5 border border-white/5 hover:bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </button>
              <button
                id="tour-profile-btn"
                onClick={() => setIsProfileOpen(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-emerald-500/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-lg shadow-black/20"
              >
                {profileAvatar ? (
                  <img
                    src={profileAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-white/80" />
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {session && (
          <header className="mb-8 sm:mb-16 text-center w-full max-w-3xl border-b border-white/5 pb-8 sm:pb-12 pt-8 sm:pt-6">
            <div className="flex justify-center mb-3 sm:mb-4">
              <img src="/icon.png?v=3" alt="Logo" className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
              Networking <span className="text-emerald-500 drop-shadow-lg">Pilot</span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-400 font-light leading-relaxed px-2 sm:px-0">
              Upload your resume. We'll extract your skills and match you with top professional networking events in your area, complete with custom pitches.
            </p>
          </header>
        )}

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
          <div className="w-full flex flex-col items-center gap-8 sm:gap-12">
            {/* Terms of Service check — blocks dashboard until accepted */}
            <TermsModal
              isOpen={showTermsModal}
              onClose={() => { }}
              onAccept={async () => {
                if (session?.user?.id) {
                  await supabase.from('user_profiles').upsert({
                    id: session.user.id,
                    terms_accepted: true,
                    consent_date: new Date().toISOString(),
                  });
                }
                setTermsAccepted(true);
                setShowTermsModal(false);
                // Show newsletter opt-in as next step
                setShowNewsletterModal(true);
              }}
              onDecline={() => {
                supabase.auth.signOut();
                setShowTermsModal(false);
              }}
            />

            {/* Newsletter opt-in — optional, shown after terms acceptance */}
            <NewsletterModal
              isOpen={showNewsletterModal}
              onSubscribe={async () => {
                if (session?.user?.id) {
                  await supabase.from('user_profiles').upsert({
                    id: session.user.id,
                    newsletter_subscribed: true,
                    newsletter_subscribed_at: new Date().toISOString(),
                  });
                }
                setShowNewsletterModal(false);
              }}
              onSkip={() => {
                setShowNewsletterModal(false);
              }}
            />

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

            <section className="w-full z-10 -mt-4 sm:-mt-6">
              <EventDashboard refreshKey={refreshKey} session={session} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
