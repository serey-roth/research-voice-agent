import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Home from '@/app/components/Home'
import { getNotionToken, getUserUsageSeconds, getUserProjectsWithSessions } from '@/lib/db'
import { DateTime } from 'luxon'

interface Project {
    productName: string
    productDescription: string
    researchGoal: string
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    issuesUrl: string | null
    issuesStatus: 'success' | 'failed' | null
}

interface Session {
    participantEmail: string
    status: 'pending' | 'active' | 'completed' | 'failed'
    briefUrl: string | null
    briefStatus: 'success' | 'failed' | null
    error?: string | null
    deletedAt?: string | null
}

export const revalidate = 0

export default async function HomePage() {
    const { userId } = await auth()
    if (!userId) redirect('/')

    const notionToken = await getNotionToken(userId!)
    if (!notionToken) redirect('/onboarding')

    const capSeconds = parseInt(process.env.ELEVENLABS_USAGE_CAP_SECONDS ?? '1800')
    const usedSeconds = await getUserUsageSeconds(userId!)
    const isOverCap = usedSeconds >= capSeconds

    const projects = await getUserProjectsWithSessions<Project, Session>(userId!)
    const sortedProjects = projects.sort(
        (a, b) =>
            DateTime.fromISO(b.createdAt).toMillis() - DateTime.fromISO(a.createdAt).toMillis()
    )

    return <Home projects={sortedProjects} isOverCap={isOverCap} />
}
