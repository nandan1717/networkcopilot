import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Networking Pilot',
        short_name: 'NetPilot',
        description:
            'AI-powered resume analysis and networking event matching for tech professionals. Upload your resume, get matched with relevant events, and receive custom pitches.',
        start_url: '/',
        display: 'standalone',
        background_color: '#050505',
        theme_color: '#10b981',
        icons: [
            {
                src: '/icon.png',
                sizes: 'any',
                type: 'image/png',
            },
        ],
        categories: ['productivity', 'business', 'networking'],
    };
}
