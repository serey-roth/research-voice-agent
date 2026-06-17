import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getNotionDatabases, getLinearTeams } from '@/app/actions'
import IntegrationsContent from './IntegrationsContent'
import { getUserIntegrations } from '@/lib/db'

export const revalidate = 0

export default async function IntegrationsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const { notionToken, notionDatabaseId, linearToken, linearTeamId } =
        await getUserIntegrations(userId)

    const notionDatabases = notionToken ? await getNotionDatabases(notionToken) : []
    const linearTeams = linearToken ? await getLinearTeams(linearToken) : []

    return (
        <IntegrationsContent
            notionConnected={!!notionToken}
            notionDatabaseId={notionDatabaseId ?? null}
            notionDatabases={notionDatabases}
            linearConnected={!!linearToken}
            linearTeamId={linearTeamId ?? null}
            linearTeams={linearTeams}
        />
    )
}
