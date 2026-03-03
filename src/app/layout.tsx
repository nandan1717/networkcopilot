import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://networkcopilot.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Networking Pilot — AI-Powered Event Matching for Tech Pros",
    template: "%s | Networking Pilot",
  },
  description:
    "Upload your resume and let AI match you with the best professional networking events in your area. Get custom pitches, skill analysis, and event recommendations tailored to your career.",
  keywords: [
    "networking events",
    "resume analysis",
    "AI career tools",
    "professional networking",
    "tech events",
    "event matching",
    "career development",
    "networking pilot",
    "skill matching",
    "custom pitches",
  ],
  authors: [{ name: "Networking Pilot" }],
  creator: "Networking Pilot",
  publisher: "Networking Pilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Networking Pilot",
    title: "Networking Pilot — AI-Powered Event Matching for Tech Pros",
    description:
      "Upload your resume and let AI match you with the best professional networking events. Get custom pitches and event recommendations tailored to your career.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Networking Pilot — AI-Powered Event Matching",
    description:
      "Upload your resume, get matched with relevant networking events, and receive custom pitches powered by AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Networking Pilot",
  url: BASE_URL,
  description:
    "AI-powered resume analysis and networking event matching for tech professionals. Upload your resume, get matched with relevant events, and receive custom pitches.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI Resume Analysis",
    "Skill Extraction & Matching",
    "Professional Networking Event Discovery",
    "Custom Pitch Generation",
    "Event Recommendations by Location",
  ],
  audience: {
    "@type": "Audience",
    audienceType: "Tech Professionals, Job Seekers, Career Networkers",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
