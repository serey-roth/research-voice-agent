'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
            .then(() => router.refresh())
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
