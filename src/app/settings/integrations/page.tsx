import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getLinearTeams } from '@/app/actions'
import IntegrationsContent from './IntegrationsContent'
import { getUserIntegrations } from '@/lib/db'

export const revalidate = 0

export default async function IntegrationsPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const { notionToken, linearToken, linearTeamId } = await getUserIntegrations(userId)

    const linearTeams = linearToken ? await getLinearTeams(linearToken) : []

    return (
        <IntegrationsContent
            notionConnected={!!notionToken}
            linearConnected={!!linearToken}
            linearTeamId={linearTeamId ?? null}
            linearTeams={linearTeams}
        />
    )
}
