import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const { notionUrl, ticketsUrl } = await request.json()

    const session = await redis.get<Record<string, unknown>>(`session:${id}`)
    if (!session) return Response.json({ error: 'not found' }, { status: 404 })

    await redis.set(`session:${id}`, {
        ...session,
        status: 'completed',
        ...(notionUrl && { notionUrl }),
        ...(ticketsUrl && { ticketsUrl }),
    })

    return Response.json({ ok: true })
}
