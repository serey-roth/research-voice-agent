import { Redis } from '@upstash/redis'
import { InterviewClient } from './InterviewClient'

const redis = Redis.fromEnv()

interface Session {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmail: string
    status: 'pending' | 'completed'
    notionUrl: string | null
    ticketsUrl: string | null
}

export default async function InterviewPage({
    params,
}: {
    params: Promise<{ sessionId: string }>
}) {
    const { sessionId } = await params
    const session = await redis.get<Session>(`session:${sessionId}`)

    if (!session) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-6">
                <p className="text-sm text-muted">This session link is invalid or has expired.</p>
            </main>
        )
    }

    if (session.status === 'completed') {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm font-medium text-ink">Interview complete</p>
                    <p className="text-sm text-muted">
                        Thanks for your time. This session has ended.
                    </p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen flex flex-col">
            <header className="border-b border-neutral-100 px-6 py-4">
                <p className="text-[13px] text-muted">
                    Research interview &mdash; {session.productName}
                </p>
            </header>

            <div className="flex flex-1 flex-col items-center justify-center py-16 px-6">
                <InterviewClient session={session} sessionId={sessionId} />
            </div>
        </main>
    )
}
