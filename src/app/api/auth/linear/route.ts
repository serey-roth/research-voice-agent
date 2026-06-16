import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET() {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const clientId = process.env.LINEAR_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!clientId || !appUrl) return new Response('Linear integration is not configured', { status: 500 })

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${appUrl}/api/auth/linear/callback`,
        response_type: 'code',
        scope: 'write',
    })

    redirect(`https://linear.app/oauth/authorize?${params}`)
}
