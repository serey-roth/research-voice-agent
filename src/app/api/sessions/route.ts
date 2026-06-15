import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const POST = async (request: Request) => {
    const body = await request.json()

    const { productName, productDescription, researchGoal, seedQuestions, participantEmail } = body

    if (
        typeof productName !== 'string' || !productName.trim() ||
        typeof productDescription !== 'string' || !productDescription.trim() ||
        typeof researchGoal !== 'string' || !researchGoal.trim() ||
        !Array.isArray(seedQuestions) || seedQuestions.length === 0 ||
        !seedQuestions.every((q) => typeof q === 'string') ||
        typeof participantEmail !== 'string' || !participantEmail.trim()
    ) {
        return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const sessionId = crypto.randomUUID()

    const session = {
        productName: productName.trim(),
        productDescription: productDescription.trim(),
        researchGoal: researchGoal.trim(),
        seedQuestions: seedQuestions.map((q: string) => q.trim()).filter(Boolean),
        participantEmail: participantEmail.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        notionUrl: null,
        ticketsUrl: null,
        notionStatus: null,
        ticketsStatus: null,
    }

    await redis.set(`session:${sessionId}`, session)
    await redis.lpush('sessions:all', sessionId)

    return Response.json({ id: sessionId })
}
