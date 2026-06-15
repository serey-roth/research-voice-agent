import { LinearClient } from '@linear/sdk'

interface PainPoint {
    title: string
    description: string
    priority: 1 | 2 | 3 | 4
}

interface TicketsBody {
    product_name: string
    pain_points: PainPoint[]
    date: string
}

const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })

async function getOrCreateProject(productName: string, teamId: string): Promise<string> {
    const existing = await linear.projects({
        filter: { name: { eq: productName } },
    })
    if (existing.nodes.length > 0) return existing.nodes[0].id
    const payload = await linear.createProject({ name: productName, teamIds: [teamId] })
    const project = await payload.project
    if (!project) throw new Error('Failed to create Linear project')
    return project.id
}

export async function POST(request: Request) {
    try {
        const body: TicketsBody = await request.json()
        const { product_name, pain_points, date } = body

        if (!pain_points || pain_points.length === 0) {
            return Response.json({ count: 0, url: null }, { status: 200 })
        }

        const teamId = process.env.LINEAR_TEAM_ID!
        const createdAt = date ? new Date(date) : undefined
        const projectId = await getOrCreateProject(product_name, teamId)

        await Promise.all(
            pain_points.map((point) =>
                linear.createIssue({
                    teamId,
                    projectId,
                    title: point.title,
                    description: point.description,
                    priority: point.priority,
                    createdAt,
                })
            )
        )

        const team = await linear.team(teamId)
        const url = `https://linear.app/team/${team.key}/projects/${projectId}`

        return Response.json({ count: pain_points.length, url }, { status: 201 })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('linear error:', err)
        return Response.json({ error: message }, { status: 500 })
    }
}
