'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LinearTeamSelector } from '../components/LinearTeamSelector'
import { createNotionDatabase } from '@/app/actions'

interface Team {
    id: string
    name: string
}

export function OnboardingNotionDatabaseSelector() {
    const router = useRouter()
    const [error, setError] = useState(false)

    useEffect(() => {
        createNotionDatabase()
            .then((result) => {
                if (typeof pendo !== 'undefined') {
                    pendo.track('notion_database_created', {
                        databaseId: result.id,
                        source: 'onboarding',
                    })
                }
                router.refresh()
            })
            .catch(() => setError(true))
    }, [router])

    if (error) {
        return (
            <p className="text-[13px] text-red-500">
                Failed to create Notion database. Please disconnect and reconnect Notion.
            </p>
        )
    }

    return <p className="text-[13px] text-muted">Setting up your Notion database…</p>
}

export function OnboardingLinearTeamSelector({ teams }: { teams: Team[] }) {
    const router = useRouter()
    return <LinearTeamSelector teams={teams} onSuccess={() => router.push('/onboarding')} />
}

export function OnboardingContinueLink({
    notionConnected,
    linearConnected,
    linearTeamSelected,
}: {
    notionConnected: boolean
    linearConnected: boolean
    linearTeamSelected: boolean
}) {
    return (
        <Link
            href="/home"
            onClick={() => {
                if (typeof pendo !== 'undefined') {
                    pendo.track('onboarding_completed', {
                        notionConnected,
                        linearConnected,
                        linearTeamSelected,
                    })
                }
            }}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-[6px] transition-colors inline-block"
        >
            Continue
        </Link>
    )
}
