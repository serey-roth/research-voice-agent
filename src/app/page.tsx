'use client'

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
            <div className="w-full max-w-xl">
                <h1 className="text-3xl font-bold mb-2">Set Up Your Research Session</h1>
                <p className="text-gray-500 mb-8">
                    Configure your interview and share the link with your participant.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Product Name</label>
                        <input
                            type="text"
                            required
                            value={form.productName}
                            onChange={(e) => setForm({ ...form, productName: e.target.value })}
                            className="border rounded px-3 py-2 text-sm"
                            placeholder="e.g. Loom"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Product Description</label>
                        <textarea
                            required
                            value={form.productDescription}
                            onChange={(e) =>
                                setForm({ ...form, productDescription: e.target.value })
                            }
                            className="border rounded px-3 py-2 text-sm resize-none"
                            rows={2}
                            placeholder="One sentence about what your product does"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Research Goal</label>
                        <textarea
                            required
                            value={form.researchGoal}
                            onChange={(e) => setForm({ ...form, researchGoal: e.target.value })}
                            className="border rounded px-3 py-2 text-sm resize-none"
                            rows={2}
                            placeholder="e.g. Understand why users drop off during onboarding"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Seed Questions</label>
                        {form.seedQuestions.map((q, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    type="text"
                                    value={q}
                                    onChange={(e) => updateSeedQuestion(i, e.target.value)}
                                    className="border rounded px-3 py-2 text-sm flex-1"
                                    placeholder={`Question ${i + 1}`}
                                />
                                {form.seedQuestions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeQuestion(i)}
                                        className="text-gray-400 hover:text-red-500 px-2"
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
                                className="text-sm text-blue-500 hover:underline self-start"
                            >
                                + Add question
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Participant Email</label>
                        <input
                            type="email"
                            required
                            value={form.participantEmail}
                            onChange={(e) =>
                                setForm({ ...form, participantEmail: e.target.value })
                            }
                            className="border rounded px-3 py-2 text-sm"
                            placeholder="participant@email.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white rounded px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300"
                    >
                        {loading ? 'Generating...' : 'Generate Interview Link'}
                    </button>
                </form>

                {interviewUrl && (
                    <div className="mt-8 p-4 bg-gray-50 rounded border">
                        <p className="text-sm font-medium mb-2">Interview Link</p>
                        <p className="text-sm text-blue-600 break-all">{interviewUrl}</p>
                        <button
                            onClick={() => navigator.clipboard.writeText(interviewUrl)}
                            className="mt-2 text-xs text-gray-500 hover:underline"
                        >
                            Copy to clipboard
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}
