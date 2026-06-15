'use client'

import Link from 'next/link'
import { useState } from 'react'

interface SessionForm {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmail: string
}

const DEFAULT_FORM: SessionForm = {
    productName: '',
    productDescription: '',
    researchGoal: '',
    seedQuestions: ['', '', ''],
    participantEmail: '',
}

export default function Home() {
    const [form, setForm] = useState<SessionForm>(DEFAULT_FORM)
    const [interviewUrl, setInterviewUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    function updateSeedQuestion(index: number, value: string) {
        const updated = [...form.seedQuestions]
        updated[index] = value
        setForm({ ...form, seedQuestions: updated })
    }

    function addQuestion() {
        setForm({ ...form, seedQuestions: [...form.seedQuestions, ''] })
    }

    function removeQuestion(index: number) {
        setForm({
            ...form,
            seedQuestions: form.seedQuestions.filter((_, i) => i !== index),
        })
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            setInterviewUrl(`${window.location.origin}/interview/${data.id}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center py-16 px-6">
            <div className="w-full max-w-[560px]">
                <div className="mb-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-ink mb-1">
                            New research session
                        </h1>
                        <p className="text-sm text-muted">
                            Configure your interview and share the link with your participant.
                        </p>
                    </div>
                    <Link
                        href="/sessions"
                        className="text-[13px] text-muted hover:text-ink transition-colors shrink-0 mt-1"
                    >
                        View sessions
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-ink">Product name</label>
                        <input
                            type="text"
                            required
                            value={form.productName}
                            onChange={(e) => setForm({ ...form, productName: e.target.value })}
                            className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg"
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
                            className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg resize-none"
                            rows={2}
                            placeholder="One sentence about what your product does"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-ink">Research goal</label>
                        <textarea
                            required
                            value={form.researchGoal}
                            onChange={(e) => setForm({ ...form, researchGoal: e.target.value })}
                            className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg resize-none"
                            rows={2}
                            placeholder="e.g. Understand why users drop off during onboarding"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[13px] font-medium text-ink">Seed questions</label>
                        <p className="text-[12px] text-muted -mt-1">
                            The AI will probe and follow up — these are starting points only.
                        </p>
                        {form.seedQuestions.map((q, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={q}
                                    onChange={(e) => updateSeedQuestion(i, e.target.value)}
                                    className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg flex-1"
                                    placeholder={`Question ${i + 1}`}
                                />
                                {form.seedQuestions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(i)}
                                        aria-label="Remove question"
                                        className="text-muted hover:text-ink transition-colors w-6 h-6 flex items-center justify-center shrink-0"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        {form.seedQuestions.length < 5 && (
                            <button
                                type="button"
                                onClick={addQuestion}
                                className="text-[13px] text-primary hover:text-primary-hover transition-colors self-start"
                            >
                                + Add question
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-ink">
                            Participant email
                        </label>
                        <p className="text-[12px] text-muted -mt-1">
                            Used to schedule follow-ups if needed. Never shared with the AI.
                        </p>
                        <input
                            type="email"
                            required
                            value={form.participantEmail}
                            onChange={(e) => setForm({ ...form, participantEmail: e.target.value })}
                            className="border border-neutral-200 rounded-[6px] px-3 py-2 text-sm text-ink placeholder:text-muted bg-bg"
                            placeholder="participant@email.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 bg-primary hover:bg-primary-hover disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded-[6px] px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        {loading ? 'Generating link…' : 'Generate interview link'}
                    </button>
                </form>

                {interviewUrl && (
                    <div className="mt-8 p-4 bg-surface rounded-lg border border-neutral-200">
                        <p className="text-[13px] font-medium text-ink mb-1">Interview link</p>
                        <p className="text-sm text-accent break-all font-mono">{interviewUrl}</p>
                        <button
                            onClick={() => navigator.clipboard.writeText(interviewUrl)}
                            className="mt-2.5 text-[12px] text-muted hover:text-ink transition-colors"
                        >
                            Copy to clipboard
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}
