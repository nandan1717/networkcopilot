import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    const termsAccepted = requestUrl.searchParams.get('terms_accepted')

    if (code) {
        const response = NextResponse.redirect(new URL('/', requestUrl.origin))

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && session?.user && termsAccepted === 'true') {
            await supabase.from('user_profiles').upsert({
                id: session.user.id,
                terms_accepted: true,
                consent_date: new Date().toISOString()
            })
        }

        return response
    }

    return NextResponse.redirect(new URL('/', requestUrl.origin))
}
