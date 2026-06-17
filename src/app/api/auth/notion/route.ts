import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function GET() {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const clientId = process.env.NOTION_CLIENT_ID
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!clientId || !appUrl)
        return new Response('Notion integration is not configured', { status: 500 })

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        owner: 'user',
        redirect_uri: `${appUrl}/api/auth/notion/callback`,
    })

    redirect(`https://api.notion.com/v1/oauth/authorize?${params}`)
}
