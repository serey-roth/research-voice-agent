'use server'

import { auth } from '@clerk/nextjs/server'
import { Client } from '@notionhq/client'
import { LinearClient } from '@linear/sdk'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { DateTime } from 'luxon'
import {
    getSession,
    setSession,
    getProject,
    setProject,
    addUserProject,
    getProjectSessionIds,
    addProjectSessionIds,
    getUserUsageSeconds,
    incrementUserUsageSeconds,
    setSessionDuration,
    getNotionCredentials,
    getNotionToken,
    getNotionTemplatePageId,
    setNotionDatabaseId,
    disconnectNotion as dbDisconnectNotion,
    getLinearCredentials,
    setLinearTeamId,
    disconnectLinear as dbDisconnectLinear,
} from '@/lib/db'

export type ToolStatus = 'success' | 'failed'

interface BriefParams {
    product_name: string
    product_description: string
    research_goal: string
    participant_email: string
    date: string
    key_findings: string
    pain_points: string
    recommended_actions: string
    transcript_summary: string
}

interface PainPoint {
    title: string
    description: string
    priority: 1 | 2 | 3 | 4
}

interface IssuesParams {
    product_name: string
    pain_points: PainPoint[]
    date: string
}

async function getSessionCreator(sessionId: string): Promise<string | null> {
    const session = await getSession<{ creatorId?: string }>(sessionId)
    return session?.creatorId ?? null
}

async function getNotionClient(
    userId: string
): Promise<{ client: Client; databaseId: string } | null> {
    const creds = await getNotionCredentials(userId)
    if (!creds) return null
    return { client: new Client({ auth: creds.token }), databaseId: creds.databaseId }
}

async function getLinearClient(
    userId: string
): Promise<{ client: LinearClient; teamId: string } | null> {
    const creds = await getLinearCredentials(userId)
    if (!creds) return null
    return { client: new LinearClient({ accessToken: creds.token }), teamId: creds.teamId }
}

export async function createBrief(
    params: BriefParams,
    sessionId: string
): Promise<{ url: string | null; status: ToolStatus }> {
    try {
        const creatorId = await getSessionCreator(sessionId)
        if (!creatorId) return { url: null, status: 'failed' }

        const notion = await getNotionClient(creatorId)
        if (!notion) return { url: null, status: 'failed' }

        const {
            product_name,
            product_description,
            research_goal,
            participant_email,
            date,
            key_findings,
            pain_points,
            recommended_actions,
            transcript_summary,
        } = params

        const page = await notion.client.pages.create({
            parent: { database_id: notion.databaseId },
            properties: {
                'Brief Title': {
                    title: [{ text: { content: `${product_name} Research Brief` } }],
                },
                'Product Name': {
                    rich_text: [{ text: { content: product_name } }],
                },
                'Product Description': {
                    rich_text: [{ text: { content: product_description } }],
                },
                'Research Goal': {
                    rich_text: [{ text: { content: research_goal } }],
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
                heading('Recommended Actions'),
                paragraph(recommended_actions),
                heading('Transcript Summary'),
                paragraph(transcript_summary),
            ],
        })

        const url = 'url' in page ? page.url : `https://notion.so/${page.id.replace(/-/g, '')}`
        return { url, status: 'success' }
    } catch (err) {
        console.error('notion error:', err)
        return { url: null, status: 'failed' }
    }
}

async function getOrCreateLinearProject(
    linear: LinearClient,
    productName: string,
    teamId: string
): Promise<{ id: string; url: string }> {
    const existing = await linear.projects({ filter: { name: { eq: productName } } })
    if (existing.nodes.length > 0) {
        const p = existing.nodes[0]
        return { id: p.id, url: p.url }
    }
    const payload = await linear.createProject({ name: productName, teamIds: [teamId] })
    const project = await payload.project
    if (!project) throw new Error('Failed to create Linear project')
    return { id: project.id, url: project.url }
}

export async function createIssues(
    params: IssuesParams,
    sessionId: string
): Promise<{ count: number; url: string | null; status: ToolStatus }> {
    try {
        const [creatorId, session] = await Promise.all([
            getSessionCreator(sessionId),
            getSession<{ participantEmail?: string }>(sessionId),
        ])
        if (!creatorId) return { count: 0, url: null, status: 'failed' }

        const linearCtx = await getLinearClient(creatorId)
        if (!linearCtx) return { count: 0, url: null, status: 'failed' }

        const { product_name, pain_points, date } = params

        if (!pain_points || pain_points.length === 0) {
            return { count: 0, url: null, status: 'success' }
        }

        const participantEmail = session?.participantEmail
        const { client: linear, teamId } = linearCtx
        const createdAt = date ? DateTime.fromISO(date, { zone: 'utc' }).toJSDate() : undefined
        const { id: projectId, url } = await getOrCreateLinearProject(linear, product_name, teamId)

        await Promise.all(
            pain_points.map((point) =>
                linear.createIssue({
                    teamId,
                    projectId,
                    title: point.title,
                    description: [
                        point.description,
                        participantEmail ? `\n---\n*Raised by: ${participantEmail}*` : '',
                    ]
                        .join('')
                        .trim(),
                    priority: point.priority,
                    createdAt,
                })
            )
        )

        return { count: pain_points.length, url, status: 'success' }
    } catch (err) {
        console.error('linear error:', err)
        return { count: 0, url: null, status: 'failed' }
    }
}

export async function completeSession(
    sessionId: string,
    data: {
        briefUrl?: string | null
        briefStatus?: ToolStatus
        issuesUrl?: string | null
        issuesStatus?: ToolStatus
    }
) {
    const session = await getSession<Record<string, unknown>>(sessionId)
    if (!session) return

    const ops: Promise<unknown>[] = [
        setSession(sessionId, {
            ...session,
            status: 'completed',
            briefUrl: session.briefUrl ?? data.briefUrl ?? null,
            briefStatus: session.briefStatus ?? data.briefStatus,
        }),
    ]

    if ((data.issuesUrl !== undefined || data.issuesStatus !== undefined) && session.projectId) {
        const project = await getProject<Record<string, unknown>>(session.projectId as string)
        if (project) {
            ops.push(
                setProject(session.projectId as string, {
                    ...project,
                    issuesUrl: project.issuesUrl ?? data.issuesUrl ?? null,
                    issuesStatus: project.issuesStatus ?? data.issuesStatus,
                })
            )
        }
    }

    await Promise.all(ops)
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

export async function recordUsage(conversationId: string, sessionId: string) {
    try {
        const creatorId = await getSessionCreator(sessionId)
        if (!creatorId) return

        const eleven = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

        // ElevenLabs may not finalize callDurationSecs immediately after disconnect — retry with backoff
        let seconds = 0
        for (let attempt = 0; attempt < 3; attempt++) {
            if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 3000))
            const conv = await eleven.conversationalAi.conversations.get(conversationId)
            seconds = Math.round(conv.metadata?.callDurationSecs ?? 0)
            if (seconds > 0) break
        }

        if (seconds > 0) {
            // duration stored as its own key — avoids read-modify-write race with completeSession
            await Promise.all([
                incrementUserUsageSeconds(creatorId, seconds),
                setSessionDuration(sessionId, seconds),
            ])
        }
    } catch (err) {
        console.error('recordUsage error:', err)
    }
}

export async function resetSession(sessionId: string): Promise<void> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')
    const session = await getSession<Record<string, unknown>>(sessionId)
    if (!session || session.creatorId !== userId) return
    await setSession(sessionId, { ...session, status: 'pending', error: null })
}

export async function selectNotionDatabase(databaseId: string): Promise<void> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')
    await setNotionDatabaseId(userId, databaseId)
}

export async function createNotionDatabase(): Promise<{ id: string }> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const [token, templatePageId] = await Promise.all([
        getNotionToken(userId),
        getNotionTemplatePageId(userId),
    ])
    if (!token) throw new Error('Notion not connected')

    const notion = new Client({ auth: token })
    const parent = templatePageId
        ? { type: 'page_id' as const, page_id: templatePageId }
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

    await setNotionDatabaseId(userId, db.id)
    return { id: db.id }
}

export async function selectLinearTeam(teamId: string): Promise<void> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')
    await setLinearTeamId(userId, teamId)
}

export async function disconnectNotion() {
    const { userId } = await auth()
    if (!userId) return
    await dbDisconnectNotion(userId)
}

export async function disconnectLinear() {
    const { userId } = await auth()
    if (!userId) return
    await dbDisconnectLinear(userId)
}

export async function createProject(
    productName: string,
    productDescription: string,
    researchGoal: string,
    participantEmails: string[]
): Promise<{ projectId: string; sessions: { id: string; participantEmail: string }[] }> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const capSeconds = parseInt(process.env.ELEVENLABS_USAGE_CAP_SECONDS ?? '1800')
    const usedSeconds = await getUserUsageSeconds(userId)
    if (usedSeconds >= capSeconds) throw new Error('Usage cap reached')

    const projectId = crypto.randomUUID()
    const now = DateTime.utc().toISO()

    const emails = [
        ...new Set(participantEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
    ]
    const sessions = emails.map((email) => ({
        id: crypto.randomUUID(),
        data: {
            projectId,
            participantEmail: email,
            creatorId: userId,
            status: 'pending',
            createdAt: now,
            briefUrl: null,
            briefStatus: null,
        },
    }))

    await Promise.all([
        setProject(projectId, {
            productName: productName.trim(),
            productDescription: productDescription.trim(),
            researchGoal: researchGoal.trim(),
            creatorId: userId,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        }),
        addUserProject(userId, projectId),
        ...sessions.map((s) => setSession(s.id, s.data)),
        ...(sessions.length ? [addProjectSessionIds(projectId, ...sessions.map((s) => s.id))] : []),
    ])

    return {
        projectId,
        sessions: sessions.map((s) => ({ id: s.id, participantEmail: s.data.participantEmail })),
    }
}

export async function updateSessionStatus(
    sessionId: string,
    status: 'active' | 'completed' | 'failed',
    error?: string
): Promise<void> {
    const session = await getSession<Record<string, unknown>>(sessionId)
    if (!session) return
    await setSession(sessionId, {
        ...session,
        status,
        ...(error !== undefined ? { error } : {}),
    })
}

export async function updateProject(
    projectId: string,
    updates: {
        productDescription?: string
        researchGoal?: string
        participantEmails?: string[]
    }
): Promise<{ sessions: { id: string; participantEmail: string }[] }> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const project = await getProject<
        Record<string, unknown> & { creatorId: string; deletedAt: string | null }
    >(projectId)
    if (!project || project.deletedAt) throw new Error('Not found')
    if (project.creatorId !== userId) throw new Error('Forbidden')

    const now = DateTime.utc().toISO()
    const ops: Promise<unknown>[] = []

    if (updates.productDescription !== undefined || updates.researchGoal !== undefined) {
        ops.push(
            setProject(projectId, {
                ...project,
                ...(updates.productDescription !== undefined && {
                    productDescription: updates.productDescription.trim(),
                }),
                ...(updates.researchGoal !== undefined && {
                    researchGoal: updates.researchGoal.trim(),
                }),
                updatedAt: now,
            })
        )
    }

    let newSessions: { id: string; participantEmail: string }[] = []

    if (updates.participantEmails?.length) {
        const existingSessionIds = await getProjectSessionIds(projectId)
        const existingSessions = await Promise.all(
            existingSessionIds.map((id) =>
                getSession<{ participantEmail: string; deletedAt?: string | null }>(id)
            )
        )
        const existingEmails = new Set(
            existingSessions
                .filter((s) => s && !s.deletedAt)
                .map((s) => s!.participantEmail.toLowerCase())
        )
        const emails = [
            ...new Set(
                updates.participantEmails.map((e) => e.trim().toLowerCase()).filter(Boolean)
            ),
        ].filter((e) => !existingEmails.has(e))

        const created = emails.map((email) => ({
            id: crypto.randomUUID(),
            data: {
                projectId,
                participantEmail: email,
                creatorId: userId,
                status: 'pending',
                createdAt: now,
                briefUrl: null,
                briefStatus: null,
            },
        }))

        ops.push(...created.map((s) => setSession(s.id, s.data)))
        if (created.length) {
            ops.push(addProjectSessionIds(projectId, ...created.map((s) => s.id)))
        }

        newSessions = created.map((s) => ({ id: s.id, participantEmail: s.data.participantEmail }))
    }

    await Promise.all(ops)
    return { sessions: newSessions }
}

export async function deleteProject(projectId: string): Promise<void> {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const project = await getProject<{ creatorId: string }>(projectId)
    if (!project) throw new Error('Not found')
    if (project.creatorId !== userId) throw new Error('Forbidden')

    const now = DateTime.utc().toISO()
    const sessionIds = await getProjectSessionIds(projectId)
    const sessions = (
        await Promise.all(
            sessionIds.map(async (id) => ({ id, data: await getSession<object>(id) }))
        )
    ).filter((s) => s.data !== null)

    await Promise.all([
        setProject(projectId, { ...project, deletedAt: now, updatedAt: now }),
        ...sessions.map((s) => setSession(s.id, { ...s.data!, deletedAt: now })),
    ])
}

export async function getNotionDatabases(token: string): Promise<{ id: string; name: string }[]> {
    try {
        const notion = new Client({ auth: token })
        const search = await notion.search({ filter: { value: 'data_source', property: 'object' } })
        type DataSourceResult = {
            id: string
            parent?: { type: string; database_id?: string }
            title?: { plain_text: string }[]
        }
        return search.results.map((r) => {
            const src = r as unknown as DataSourceResult
            const id =
                src.parent?.type === 'database_id' && src.parent.database_id
                    ? src.parent.database_id
                    : src.id
            const name = src.title?.[0]?.plain_text ?? 'Untitled'
            return { id, name }
        })
    } catch {
        return []
    }
}

export async function getLinearTeams(token: string): Promise<{ id: string; name: string }[]> {
    try {
        const linear = new LinearClient({ accessToken: token })
        const { nodes } = await linear.teams()
        return nodes.map((t) => ({ id: t.id, name: t.name }))
    } catch {
        return []
    }
}
