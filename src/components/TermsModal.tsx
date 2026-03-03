import { X } from 'lucide-react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    onDecline: () => void;
}

export function TermsModal({ isOpen, onClose, onAccept, onDecline }: TermsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
                <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white">Terms of Service and Privacy Consent</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-gray-300 space-y-6 text-sm">
                    <p className="font-medium text-white">Last Updated: February 25, 2026</p>

                    <p>
                        Welcome to Networking Pilot. By clicking "I Accept," you agree to the following Terms and Conditions and consent to our data practices. If you do not agree, you must decline and discontinue use of the application.
                    </p>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">1. Description of Service</h3>
                        <p>Networking Pilot is a web-based platform designed to match users with relevant professional events and networking opportunities based on their professional profiles, interests, and stated goals.</p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">2. What Data We Collect</h3>
                        <p>To provide our service, we collect and process the following information:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Account Information:</strong> Name, email address, and authentication data.</li>
                            <li><strong className="text-white">Professional Profile:</strong> Job title, industry, skills, networking goals, and any biographical information you choose to provide.</li>
                            <li><strong className="text-white">Usage Data:</strong> Search queries, event preferences, and interaction history within the application.</li>
                            <li><strong className="text-white">Location Data:</strong> General location data (e.g., city or region) to recommend geographically relevant events. We do not track precise GPS coordinates without explicit, separate consent.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">3. How We Use Your Data (Privacy Consent)</h3>
                        <p>By using Networking Pilot, you consent to the processing of your data for the following purposes:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Personalization:</strong> To match you with relevant professional events and contacts.</li>
                            <li><strong className="text-white">Service Improvement:</strong> To analyze aggregate usage trends and improve our matching algorithms.</li>
                            <li><strong className="text-white">Communication:</strong> To send you account notifications, event updates, and service-related emails.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">4. AI Processing and Third-Party Services</h3>
                        <p>Networking Pilot utilizes artificial intelligence to analyze your professional profile and generate networking recommendations.</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Google Gemini API:</strong> Your profile data and queries are processed using Google's Gemini API. By accepting these terms, you consent to this data transfer.</li>
                            <li><strong className="text-white">Data Protection:</strong> We utilize enterprise-tier API endpoints. Your personal data is processed strictly for generating your session results and is not used by Google to train public, global AI models.</li>
                            <li><strong className="text-white">Data Minimization:</strong> We only send the minimum data required (e.g., industry, goals, location) to the API to generate accurate matches.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">5. Data Storage, Retention, and Deletion</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong className="text-white">Storage:</strong> Your data is securely stored using modern database infrastructure.</li>
                            <li><strong className="text-white">Retention:</strong> We retain your active profile data and event matches for as long as your account remains active.</li>
                            <li><strong className="text-white">Your Right to Delete:</strong> You have the right to request the deletion of your account and all associated personal data at any time through the application settings. Upon request, all personally identifiable information will be permanently purged from our active databases within 30 days.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">6. User Responsibilities</h3>
                        <p>You agree to:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Provide accurate and truthful information.</li>
                            <li>Refrain from inputting highly sensitive personal information (e.g., financial data, social insurance numbers, private home addresses) into the application.</li>
                            <li>Respect the privacy and professional boundaries of other users and event attendees you connect with through the platform.</li>
                        </ul>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">7. Limitation of Liability</h3>
                        <p>Networking Pilot provides event recommendations and AI-generated networking strategies "as is." We do not guarantee the quality, safety, or outcome of any professional event or connection made through the platform. You attend events and engage with contacts at your own risk.</p>
                    </section>

                    <section className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">8. Governing Law</h3>
                        <p>These Terms shall be governed by and construed in accordance with the laws of the Province of British Columbia, and the federal laws of Canada applicable therein.</p>
                    </section>
                </div>

                <div className="p-5 border-t border-white/10 bg-white/5 flex gap-4">
                    <button
                        onClick={() => {
                            onDecline();
                            onClose();
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => {
                            onAccept();
                            onClose();
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
                    >
                        I Accept
                    </button>
                </div>
            </div>
        </div>
    );
}
