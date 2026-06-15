import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const POST = async (request: Request) => {
    const body = await request.json()

    const sessionId = crypto.randomUUID()

    const session = {
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString(),
        docUrl: null,
    }

    await redis.set(`session:${sessionId}`, session)
    await redis.lpush('sessions:all', sessionId)

    return Response.json({ id: sessionId })
}
