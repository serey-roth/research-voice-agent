import { auth } from '@clerk/nextjs/server'
import { Redis } from '@upstash/redis'
import { redirect } from 'next/navigation'
import IntegrationsContent from './IntegrationsContent'

const redis = Redis.fromEnv()

export const revalidate = 0

export default async function IntegrationsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const [notionToken, linearToken] = await Promise.all([
        redis.get(`user:${userId}:notion_token`),
        redis.get(`user:${userId}:linear_token`),
    ])

    return <IntegrationsContent notionConnected={!!notionToken} linearConnected={!!linearToken} />
}
