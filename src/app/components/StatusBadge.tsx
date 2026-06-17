export type SessionStatus = 'pending' | 'active' | 'completed' | 'failed'

const STATUS_STYLES: Record<SessionStatus, string> = {
    pending: 'text-muted',
    active: 'text-blue-500',
    completed: 'text-ink',
    failed: 'text-red-400',
}

const STATUS_LABELS: Record<SessionStatus, string> = {
    pending: 'Pending',
    active: 'Active',
    completed: 'Done',
    failed: 'Failed',
}

export function StatusBadge({ status, title }: { status: SessionStatus; title?: string }) {
    return (
        <span
            title={title}
            className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-100 ${STATUS_STYLES[status]} ${title ? 'cursor-help' : ''}`}
        >
            {STATUS_LABELS[status]}
        </span>
    )
}
