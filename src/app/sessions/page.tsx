import Link from 'next/link'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

interface Session {
    productName: string
    researchGoal: string
    participantEmail: string
    status: 'pending' | 'completed'
    createdAt: string
    notionUrl: string | null
    ticketsUrl: string | null
}

export const revalidate = 0

export default async function SessionsPage() {
    const sessionIds = await redis.lrange<string>('sessions:all', 0, -1)

    const sessions = sessionIds.length
        ? await Promise.all(
              sessionIds.map(async (id) => {
                  const session = await redis.get<Session>(`session:${id}`)
                  return session ? { id, ...session } : null
              })
          )
        : []

    const valid = sessions.filter(Boolean) as ({ id: string } & Session)[]

    return (
        <main className="min-h-screen flex flex-col items-center py-16 px-6">
            <div className="w-full max-w-[720px]">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sessions</h1>
                        <p className="text-sm text-muted mt-0.5">{valid.length} total</p>
                    </div>
                    <Link
                        href="/"
                        className="text-sm text-primary hover:text-primary-hover transition-colors"
                    >
                        + New session
                    </Link>
                </div>

                {valid.length === 0 ? (
                    <p className="text-sm text-muted">No sessions yet.</p>
                ) : (
                    <div className="flex flex-col divide-y divide-neutral-100">
                        {valid.map((s) => (
                            <div key={s.id} className="py-4 flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <p className="text-sm font-medium text-ink truncate">
                                        {s.productName}
                                    </p>
                                    <p className="text-[13px] text-muted truncate">
                                        {s.researchGoal}
                                    </p>
                                    <p className="text-[12px] text-muted">
                                        {s.participantEmail} &middot;{' '}
                                        {new Date(s.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span
                                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                            s.status === 'completed'
                                                ? 'bg-surface text-ink'
                                                : 'bg-surface text-muted'
                                        }`}
                                    >
                                        {s.status === 'completed' ? 'Done' : 'Pending'}
                                    </span>

                                    {s.status === 'pending' && (
                                        <a
                                            href={`/interview/${s.id}`}
                                            className="text-[13px] text-muted hover:text-ink transition-colors"
                                        >
                                            Interview link ↗
                                        </a>
                                    )}

                                    {s.notionUrl && (
                                        <a
                                            href={s.notionUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[13px] text-primary hover:text-primary-hover transition-colors"
                                        >
                                            Brief ↗
                                        </a>
                                    )}

                                    {s.ticketsUrl && (
                                        <a
                                            href={s.ticketsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[13px] text-primary hover:text-primary-hover transition-colors"
                                        >
                                            Tickets ↗
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}
