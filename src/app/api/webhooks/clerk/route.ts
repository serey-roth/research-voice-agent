import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function POST(req: Request) {
    const secret = process.env.CLERK_WEBHOOK_SECRET
    if (!secret) return new Response('Webhook secret not configured', { status: 500 })

    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Missing svix headers', { status: 400 })
    }

    const body = await req.text()

    let event: { type: string; data: { id: string } }
    try {
        const wh = new Webhook(secret)
        event = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        }) as typeof event
    } catch {
        return new Response('Invalid signature', { status: 400 })
    }

    if (event.type === 'user.deleted') {
        const userId = event.data.id
        const projectIds = await redis.lrange<string>(`projects:user:${userId}`, 0, -1)

        const allSessionIds: string[] = []
        if (projectIds.length) {
            const perProject = await Promise.all(
                projectIds.map((id) => redis.lrange<string>(`sessions:project:${id}`, 0, -1))
            )
            allSessionIds.push(...perProject.flat())
        }

        await Promise.all([
            redis.del(`projects:user:${userId}`),
            redis.del(`user:${userId}:notion_token`),
            redis.del(`user:${userId}:notion_database_id`),
            redis.del(`user:${userId}:linear_token`),
            redis.del(`user:${userId}:linear_team_id`),
            redis.del(`user:${userId}:usage:seconds`),
            ...projectIds.flatMap((id) => [
                redis.del(`project:${id}`),
                redis.del(`sessions:project:${id}`),
            ]),
            ...allSessionIds.flatMap((id) => [
                redis.del(`session:${id}`),
                redis.del(`session:${id}:duration`),
            ]),
        ])
    }

    return new Response('OK', { status: 200 })
}
