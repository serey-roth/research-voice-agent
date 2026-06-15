'use server'

import { Client } from '@notionhq/client'
import { LinearClient } from '@linear/sdk'
import { Redis } from '@upstash/redis'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const linear = new LinearClient({ apiKey: process.env.LINEAR_API_KEY })
const redis = Redis.fromEnv()

export type ToolStatus = 'success' | 'failed'

interface NotionBriefParams {
    product_name: string
    participant_email: string
    date: string
    key_findings: string
    pain_points: string
    validated_assumptions: string
    recommended_actions: string
    transcript_summary: string
}

interface PainPoint {
    title: string
    description: string
    priority: 1 | 2 | 3 | 4
}

interface TicketsParams {
    product_name: string
    pain_points: PainPoint[]
    date: string
}

export async function createNotionBrief(
    params: NotionBriefParams
): Promise<{ url: string | null; status: ToolStatus }> {
    try {
        const {
            product_name,
            participant_email,
            date,
            key_findings,
            pain_points,
            validated_assumptions,
            recommended_actions,
            transcript_summary,
        } = params

        const page = await notion.pages.create({
            parent: { database_id: process.env.NOTION_DATABASE_ID! },
            properties: {
                'Brief Title': {
                    title: [{ text: { content: `${product_name} Research Brief` } }],
                },
                'Product Name': {
                    rich_text: [{ text: { content: product_name } }],
                },
                'Participant Email': {
                    email: participant_email,
                },
                'Interview Date': {
                    date: { start: date },
                },
            },
            children: [
                heading('Key Findings'),
                paragraph(key_findings),
                heading('Pain Points'),
                paragraph(pain_points),
                heading('Validated Assumptions'),
                paragraph(validated_assumptions),
                heading('Recommended Actions'),
                paragraph(recommended_actions),
                heading('Transcript Summary'),
                paragraph(transcript_summary),
            ],
        })

        const url = `https://notion.so/${page.id.replace(/-/g, '')}`
        return { url, status: 'success' }
    } catch (err) {
        console.error('notion error:', err)
        return { url: null, status: 'failed' }
    }
}

async function getOrCreateProject(productName: string, teamId: string): Promise<string> {
    const existing = await linear.projects({ filter: { name: { eq: productName } } })
    if (existing.nodes.length > 0) return existing.nodes[0].id
    const payload = await linear.createProject({ name: productName, teamIds: [teamId] })
    const project = await payload.project
    if (!project) throw new Error('Failed to create Linear project')
    return project.id
}

export async function createTickets(
    params: TicketsParams
): Promise<{ count: number; url: string | null; status: ToolStatus }> {
    try {
        const { product_name, pain_points, date } = params

        if (!pain_points || pain_points.length === 0) {
            return { count: 0, url: null, status: 'success' }
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
        return { count: pain_points.length, url, status: 'success' }
    } catch (err) {
        console.error('linear error:', err)
        return { count: 0, url: null, status: 'failed' }
    }
}

export async function completeSession(
    sessionId: string,
    data: {
        notionUrl?: string | null
        ticketsUrl?: string | null
        notionStatus?: ToolStatus
        ticketsStatus?: ToolStatus
    }
) {
    const session = await redis.get<Record<string, unknown>>(`session:${sessionId}`)
    if (!session) return
    await redis.set(`session:${sessionId}`, {
        ...session,
        status: 'completed',
        ...data,
    })
}

function heading(text: string) {
    return {
        object: 'block' as const,
        type: 'heading_2' as const,
        heading_2: { rich_text: [{ type: 'text' as const, text: { content: text } }] },
    }
}

function paragraph(text: string) {
    return {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: { rich_text: [{ type: 'text' as const, text: { content: text } }] },
    }
}
