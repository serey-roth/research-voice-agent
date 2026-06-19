'use client'

import Image from 'next/image'
import Link from 'next/link'

import { User } from 'lucide-react'
import { AppLogo } from './AppLogo'
import VoiceScopeWaveform from './VoiceScopeWaveform'
import { StatusBadge } from './StatusBadge'

function NotionMark({ size = 16 }: { size?: number }) {
    return (
        <Image
            src="/notion_app_logo.png"
            alt="Notion"
            width={size}
            height={size}
            className="shrink-0 rounded-[3px]"
        />
    )
}

function LinearMark({ size = 16 }: { size?: number }) {
    return (
        <Image
            src="/linear_app_logo.webp"
            alt="Linear"
            width={size}
            height={size}
            className="shrink-0 rounded-[3px]"
        />
    )
}

function ResearchGoalPreview() {
    return (
        <div className="w-full max-w-[220px] flex flex-col gap-3">
            <div className="flex flex-col gap-0.5 opacity-35">
                <p className="text-[10px] text-muted uppercase tracking-widest">Product</p>
                <p className="text-[12px] font-semibold text-ink">Acme Dashboard</p>
            </div>
            <div className="flex flex-col gap-0.5 opacity-25">
                <p className="text-[10px] text-muted uppercase tracking-widest">Description</p>
                <p className="text-[12px] text-muted">A data viz tool for enterprise teams</p>
            </div>
            <div className="rounded-[6px] p-2.5 flex flex-col gap-1.5 bg-primary/5 border border-primary/20">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                    Research Goal
                </p>
                <p className="text-[12px] text-ink leading-relaxed">
                    Understand where users drop off during onboarding
                    <span className="inline-block w-px h-3 bg-primary ml-0.5 align-middle animate-pulse" />
                </p>
            </div>
        </div>
    )
}

function ParticipantsPreview() {
    const participants = [
        { email: 'sarah@company.com', status: 'completed' as const },
        { email: 'marcus@startup.io', status: 'pending' as const },
        { email: 'priya@corp.co', status: 'completed' as const },
    ]
    return (
        <div className="w-full max-w-[240px] flex flex-col gap-1.5">
            {participants.map((p, i) => {
                const focused = i === 1
                return (
                    <div
                        key={p.email}
                        className={`flex items-center gap-2.5 py-1.5 px-2 rounded-[6px] ${
                            focused
                                ? 'bg-surface border border-neutral-100'
                                : 'opacity-25 pointer-events-none'
                        }`}
                        style={focused ? undefined : { filter: 'blur(1px)' }}
                    >
                        <User size={11} className="text-muted shrink-0" />
                        <p className="text-[12px] text-muted flex-1 truncate">{p.email}</p>
                        <StatusBadge status={p.status} />
                        {p.status === 'pending' && (
                            <span className="text-[11px] text-primary font-medium whitespace-nowrap">
                                Copy link
                            </span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

const AGENT_TEXT = '"What did you expect to see on that step?"'

function InterviewPreview() {
    return (
        <div className="w-full max-w-[240px] flex flex-col gap-3">
            <div className="flex items-center justify-center">
                <span className="font-mono text-[10px] text-muted">00:02:18</span>
            </div>

            <div className="flex items-center justify-center" style={{ height: 44 }}>
                <VoiceScopeWaveform state="speaking" bare scale={0.5} showControls={false} />
            </div>

            <p
                className="font-mono text-[10px] text-muted border-t border-neutral-100 pt-2 leading-relaxed"
                style={{ minHeight: 34 }}
            >
                {AGENT_TEXT}
            </p>
        </div>
    )
}

function FindingsPreview() {
    return (
        <div className="w-full max-w-[240px] flex flex-col gap-2">
            <div className="rounded-[6px] border border-neutral-100 p-2.5 flex items-start gap-2">
                <NotionMark />
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink">Research Brief</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                        Friction peaks at step 3 — 7 of 9 users stalled before connecting a source.
                    </p>
                </div>
            </div>
            <div className="rounded-[6px] border border-neutral-100 p-2.5 flex items-start gap-2">
                <LinearMark />
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink">3 issues filed</p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                        {['P1 · Onboarding', 'P2 · Copy'].map((label) => (
                            <span
                                key={label}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary"
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Feature definitions ──────────────────────────────────────────────────────

const FEATURES = [
    {
        title: 'Set a research goal',
        description: 'VoiceScope shapes the interview around your research goal.',
        preview: <ResearchGoalPreview />,
    },
    {
        title: 'Invite participants',
        description: 'Each participant interviews on their own time — no scheduling needed.',
        preview: <ParticipantsPreview />,
    },
    {
        title: 'AI conducts the interview',
        description: 'One question at a time, with follow-up probes for vague answers.',
        preview: <InterviewPreview />,
    },
    {
        title: 'Findings in Notion and Linear',
        description: 'A brief is saved to Notion. Pain points become issues in Linear.',
        preview: <FindingsPreview />,
    },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
    return (
        <div className="min-h-dvh bg-bg text-ink flex flex-col">
            {/* Nav */}
            <header className="flex items-center px-6 md:px-10 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                    <AppLogo size={28} />
                    <span className="text-sm font-semibold tracking-tight">VoiceScope</span>
                </div>
            </header>

            {/* Hero + Features */}
            <main className="flex-1 px-6 md:px-10 pt-16 md:pt-24 pb-16">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 items-start">

                    {/* Left — headline */}
                    <div className="md:pt-2">
                        <h1 className="text-5xl md:text-6xl font-bold text-ink tracking-[-0.04em] leading-none">
                            Voice agent for{' '}
                            <br />
                            <span className="italic font-light">user research</span>
                        </h1>
                        <p className="text-sm text-muted leading-relaxed mt-6 max-w-sm">
                            VoiceScope runs async voice interviews with your users and delivers
                            structured findings to Notion and Linear. No scheduling, no note-taking.
                        </p>
                        <div className="mt-8">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center px-5 py-2.5 bg-ink text-bg rounded-full text-sm font-medium hover:opacity-80 active:scale-[0.97] transition duration-150"
                            >
                                Try demo
                            </Link>
                        </div>
                    </div>

                    {/* Right — 2×2 feature grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="flex flex-col gap-3">
                                <div className="h-[200px] rounded-xl border border-neutral-100 bg-surface overflow-hidden flex items-center justify-center p-4">
                                    {f.preview}
                                </div>
                                <div>
                                    <h3 className="text-[12px] font-semibold text-ink leading-snug">
                                        {f.title}
                                    </h3>
                                    <p className="mt-1 text-[12px] text-muted leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className="border-t border-neutral-100" />
            <footer className="px-6 md:px-10 py-4">
                <span className="text-xs text-muted">© {new Date().getFullYear()} VoiceScope</span>
            </footer>
        </div>
    )
}
