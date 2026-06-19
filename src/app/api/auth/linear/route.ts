import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const clientId = process.env.LINEAR_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!clientId || !appUrl)
        return new Response('Linear integration is not configured', { status: 500 })

    const { searchParams } = new URL(request.url)
    const returnTo = searchParams.get('returnTo') ?? '/onboarding'

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${appUrl}/api/auth/linear/callback`,
        response_type: 'code',
        scope: 'write',
        state: returnTo,
    })

    redirect(`https://linear.app/oauth/authorize?${params}`)
}
