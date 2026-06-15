import { LinearClient } from '@linear/sdk'

interface PainPoint {
    title: string
    description: string
    priority: 1 | 2 | 3 | 4
}

interface TicketsBody {
    pain_points: PainPoint[]
    date: string
}

const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

export async function POST(request: Request) {
    try {
        const body: TicketsBody = await request.json()
        const { pain_points, date } = body

        if (!pain_points || pain_points.length === 0) {
            return Response.json({ count: 0, url: null }, { status: 200 })
        }

        const createdAt = date ? new Date(date) : undefined

        await Promise.all(
            pain_points.map((point) =>
                linear.createIssue({
                    teamId: process.env.LINEAR_TEAM_ID!,
                    title: point.title,
                    description: point.description,
                    priority: point.priority,
                    createdAt,
                })
            )
        )

        const team = await linear.team(process.env.LINEAR_TEAM_ID!)
        const url = `https://linear.app/team/${team.key}/issues`

        return Response.json({ count: pain_points.length, url }, { status: 201 })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('linear error:', err)
        return Response.json({ error: message }, { status: 500 })
    }
}
