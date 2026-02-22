import { NextRequest, NextResponse } from 'next/server'

// This route receives the PKCE `code` from Supabase's password-reset email.
// It forwards the code to the home page as a query param so the client-side
// Supabase client can exchange it for a session and fire PASSWORD_RECOVERY.
export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    const redirectUrl = new URL('/', requestUrl.origin)
    if (code) {
        redirectUrl.searchParams.set('code', code)
    }

    return NextResponse.redirect(redirectUrl)
}
