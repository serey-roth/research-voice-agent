import { auth } from '@clerk/nextjs/server'
import { Redis } from '@upstash/redis'
import { Client } from '@notionhq/client'
import { redirect } from 'next/navigation'

const redis = Redis.fromEnv()

export async function GET(request: Request) {
    const { userId } = await auth()
    if (!userId) return new Response('Unauthorized', { status: 401 })

    const clientId = process.env.NOTION_CLIENT_ID
    const clientSecret = process.env.NOTION_CLIENT_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!clientId || !clientSecret || !appUrl) return new Response('Notion integration is not configured', { status: 500 })

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) redirect('/onboarding')

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const res = await fetch('https://api.notion.com/v1/oauth/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${appUrl}/api/auth/notion/callback`,
        }),
    })

    if (!res.ok) redirect('/onboarding')

    const data = await res.json()
    const accessToken = data.access_token as string

    const notion = new Client({ auth: accessToken })
    let databaseId: string

    try {
        const parent = data.duplicated_template_id
            ? { type: 'page_id' as const, page_id: data.duplicated_template_id as string }
            : { type: 'workspace' as const, workspace: true as const }

        const db = await notion.databases.create({
            parent,
            title: [{ type: 'text', text: { content: 'VoiceScope Research Briefs' } }],
            initial_data_source: {
                properties: {
                    'Brief Title': { title: {} },
                    'Product Name': { rich_text: {} },
                    'Product Description': { rich_text: {} },
                    'Research Goal': { rich_text: {} },
                    'Participant Email': { email: {} },
                    'Interview Date': { date: {} },
                },
            },
        })
        databaseId = db.id
    } catch {
        databaseId = ''
    }

    await redis.set(`user:${userId}:notion_token`, accessToken)
    await redis.set(`user:${userId}:notion_workspace`, data.workspace_name ?? '')
    if (databaseId) await redis.set(`user:${userId}:notion_database_id`, databaseId)

    redirect('/onboarding')
}
