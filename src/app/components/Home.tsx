'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import App from './App'

interface Session {
    id: string
    participantEmail: string
    status: 'pending' | 'completed'
    notionUrl: string | null
    ticketsUrl: string | null
}

interface Project {
    id: string
    productName: string
    researchGoal: string
    createdAt: string
    sessions: Session[]
}

interface ProjectForm {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmails: string[]
}

const DEFAULT_FORM: ProjectForm = {
    productName: '',
    productDescription: '',
    researchGoal: '',
    seedQuestions: ['', '', ''],
    participantEmails: [''],
}

interface InterviewLink {
    participantEmail: string
    url: string
}

function projectStatus(sessions: Session[]): 'active' | 'complete' {
    if (!sessions.length) return 'active'
    return sessions.every((s) => s.status === 'completed') ? 'complete' : 'active'
}

export default function Home({ projects, isOverCap }: { projects: Project[]; isOverCap: boolean }) {
    const router = useRouter()
    const [panelOpen, setPanelOpen] = useState(false)
    const [form, setForm] = useState<ProjectForm>(DEFAULT_FORM)
    const [interviewLinks, setInterviewLinks] = useState<InterviewLink[] | null>(null)
    const [loading, setLoading] = useState(false)

    function updateSeedQuestion(index: number, value: string) {
        const updated = [...form.seedQuestions]
        updated[index] = value
        setForm({ ...form, seedQuestions: updated })
    }

    function addSeedQuestion() {
        setForm({ ...form, seedQuestions: [...form.seedQuestions, ''] })
    }

    function removeSeedQuestion(index: number) {
        setForm({ ...form, seedQuestions: form.seedQuestions.filter((_, i) => i !== index) })
    }

    function updateEmail(index: number, value: string) {
        const updated = [...form.participantEmails]
        updated[index] = value
        setForm({ ...form, participantEmails: updated })
    }

    function addEmail() {
        setForm({ ...form, participantEmails: [...form.participantEmails, ''] })
    }

    function removeEmail(index: number) {
        setForm({
            ...form,
            participantEmails: form.participantEmails.filter((_, i) => i !== index),
        })
    }

    function closePanel() {
        setPanelOpen(false)
        setInterviewLinks(null)
        setForm(DEFAULT_FORM)
    }

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    participantEmails: form.participantEmails.filter((e) => e.trim()),
                }),
            })
            const data = await res.json()
            setInterviewLinks(
                data.sessions.map((s: { id: string; participantEmail: string }) => ({
                    participantEmail: s.participantEmail,
                    url: `${window.location.origin}/interview/${s.id}`,
                }))
            )
            router.refresh()
        } finally {
            setLoading(false)
        }
    }

    const header = (
        <>
            <h1 className="text-[15px] font-semibold text-ink mr-auto">Projects</h1>
            <button
                onClick={() => !isOverCap && setPanelOpen(true)}
                disabled={isOverCap}
                title={isOverCap ? 'Usage limit reached' : undefined}
                className="bg-primary hover:bg-primary-hover text-bg text-[13px] font-medium px-3 py-1.5 rounded-[6px] transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
                <span className="hidden sm:inline">+ New project</span>
                <span className="sm:hidden">+</span>
            </button>
        </>
    )

    return (
        <App header={header}>
            <div className="flex-1 overflow-y-auto">
                {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 pb-16 px-6 text-center">
                        <p className="text-sm text-muted">No projects yet.</p>
                        {!isOverCap && (
                            <button
                                onClick={() => setPanelOpen(true)}
                                className="text-[13px] text-primary hover:text-primary-hover transition-colors"
                            >
                                Create your first project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {projects.map((project) => {
                            const status = projectStatus(project.sessions)
                            return (
                                <div key={project.id} className="px-4 lg:px-8 py-4">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="text-[13px] font-medium text-ink">
                                                    {project.productName}
                                                </p>
                                                <span
                                                    className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                                                        status === 'complete'
                                                            ? 'bg-neutral-100 text-ink'
                                                            : 'bg-neutral-100 text-muted'
                                                    }`}
                                                >
                                                    {status === 'complete' ? 'Complete' : 'Active'}
                                                </span>
                                            </div>
                                            <p className="text-[13px] text-muted truncate">
                                                {project.researchGoal}
                                            </p>
                                        </div>
                                        <p className="text-[12px] text-muted shrink-0 mt-0.5">
                                            {new Date(project.createdAt).toLocaleDateString(
                                                'en-US',
                                                {
                                                    month: 'short',
                                                    day: 'numeric',
                                                }
                                            )}
                                        </p>
                                    </div>

                                    {project.sessions.length > 0 && (
                                        <div className="flex flex-col gap-1.5 pl-3 border-l border-neutral-100">
                                            {project.sessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="flex items-center gap-3 flex-wrap"
                                                >
                                                    <p className="text-[12px] text-muted flex-1 min-w-0 truncate">
                                                        {session.participantEmail}
                                                    </p>
                                                    <div className="flex items-center gap-2.5 shrink-0">
                                                        <span
                                                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-100 ${
                                                                session.status === 'completed'
                                                                    ? 'text-ink'
                                                                    : 'text-muted'
                                                            }`}
                                                        >
                                                            {session.status === 'completed'
                                                                ? 'Done'
                                                                : 'Pending'}
                                                        </span>
                                                        {session.status === 'pending' && (
                                                            <a
                                                                href={`/interview/${session.id}`}
                                                                className="text-[12px] text-muted hover:text-ink transition-colors"
                                                            >
                                                                Interview ↗
                                                            </a>
                                                        )}
                                                        {session.notionUrl && (
                                                            <a
                                                                href={session.notionUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[12px] text-primary hover:text-primary-hover transition-colors"
                                                            >
                                                                Brief ↗
                                                            </a>
                                                        )}
                                                        {session.ticketsUrl && (
                                                            <a
                                                                href={session.ticketsUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[12px] text-primary hover:text-primary-hover transition-colors"
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
                            )
                        })}
                    </div>
                )}
            </div>

            <div
                className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-200 ${
                    panelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={closePanel}
            />

            <div
                className={`fixed right-0 top-0 h-full w-full sm:w-[440px] bg-bg border-l border-neutral-200 z-50 flex flex-col transition-transform duration-200 ease-out ${
                    panelOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="h-14 px-6 flex items-center justify-between border-b border-neutral-100 shrink-0">
                    <h2 className="text-[15px] font-semibold text-ink">New project</h2>
                    <button
                        onClick={closePanel}
                        className="text-muted hover:text-ink transition-colors w-7 h-7 flex items-center justify-center rounded-[4px] hover:bg-neutral-100 outline-none"
                        aria-label="Close"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                                d="M1 1L11 11M11 1L1 11"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {interviewLinks ? (
                        <div className="flex flex-col gap-4">
                            <p className="text-[13px] font-medium text-ink">
                                {interviewLinks.length === 1
                                    ? 'Interview link ready'
                                    : `${interviewLinks.length} interview links ready`}
                            </p>
                            <div className="flex flex-col gap-3">
                                {interviewLinks.map((link) => (
                                    <div
                                        key={link.participantEmail}
                                        className="p-4 bg-surface rounded-lg border border-neutral-200"
                                    >
                                        <p className="text-[12px] text-muted mb-1">
                                            {link.participantEmail}
                                        </p>
                                        <p className="text-[12px] text-accent break-all font-mono leading-relaxed">
                                            {link.url}
                                        </p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(link.url)}
                                            className="mt-2 text-[12px] text-muted hover:text-ink transition-colors"
                                        >
                                            Copy link
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setInterviewLinks(null)
                                    setForm(DEFAULT_FORM)
                                }}
                                className="text-[13px] text-muted hover:text-ink transition-colors self-start"
                            >
                                ← Create another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-ink">
                                    Product name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.productName}
                                    onChange={(e) =>
                                        setForm({ ...form, productName: e.target.value })
                                    }
                                    className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg focus:outline-none focus:border-primary transition-colors"
                                    placeholder="e.g. Loom"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-ink">
                                    Product description
                                </label>
                                <textarea
                                    required
                                    value={form.productDescription}
                                    onChange={(e) =>
                                        setForm({ ...form, productDescription: e.target.value })
                                    }
                                    className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg resize-none focus:outline-none focus:border-primary transition-colors"
                                    rows={2}
                                    placeholder="One sentence about what your product does"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] font-medium text-ink">
                                    Research goal
                                </label>
                                <textarea
                                    required
                                    value={form.researchGoal}
                                    onChange={(e) =>
                                        setForm({ ...form, researchGoal: e.target.value })
                                    }
                                    className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg resize-none focus:outline-none focus:border-primary transition-colors"
                                    rows={2}
                                    placeholder="e.g. Understand why users drop off during onboarding"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-ink">
                                    Seed questions
                                </label>
                                <p className="text-[12px] text-muted -mt-1">
                                    The AI will probe and follow up — these are starting points
                                    only.
                                </p>
                                {form.seedQuestions.map((q, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={q}
                                            onChange={(e) => updateSeedQuestion(i, e.target.value)}
                                            className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg flex-1 focus:outline-none focus:border-primary transition-colors"
                                            placeholder={`Question ${i + 1}`}
                                        />
                                        {form.seedQuestions.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSeedQuestion(i)}
                                                aria-label="Remove"
                                                className="text-muted hover:text-ink transition-colors w-6 h-6 flex items-center justify-center shrink-0 outline-none"
                                            >
                                                <svg
                                                    width="10"
                                                    height="10"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M1 1L11 11M11 1L1 11"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {form.seedQuestions.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={addSeedQuestion}
                                        className="text-[13px] text-primary hover:text-primary-hover transition-colors self-start outline-none"
                                    >
                                        + Add question
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[13px] font-medium text-ink">
                                    Participants
                                </label>
                                <p className="text-[12px] text-muted -mt-1">
                                    Each participant gets their own unique interview link.
                                </p>
                                {form.participantEmails.map((email, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => updateEmail(i, e.target.value)}
                                            className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg flex-1 focus:outline-none focus:border-primary transition-colors"
                                            placeholder="participant@email.com"
                                        />
                                        {form.participantEmails.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeEmail(i)}
                                                aria-label="Remove"
                                                className="text-muted hover:text-ink transition-colors w-6 h-6 flex items-center justify-center shrink-0 outline-none"
                                            >
                                                <svg
                                                    width="10"
                                                    height="10"
                                                    viewBox="0 0 12 12"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M1 1L11 11M11 1L1 11"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addEmail}
                                    className="text-[13px] text-primary hover:text-primary-hover transition-colors self-start outline-none"
                                >
                                    + Add participant
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-1 bg-primary hover:bg-primary-hover disabled:bg-neutral-200 disabled:text-neutral-400 text-bg rounded-[6px] px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                {loading ? 'Generating links…' : 'Generate interview links'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </App>
    )
}
