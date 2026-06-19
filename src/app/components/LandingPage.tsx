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
            style={{ flexShrink: 0, borderRadius: 3 }}
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
            style={{ flexShrink: 0, borderRadius: 3 }}
        />
    )
}

function ResearchGoalPreview() {
    return (
        <div className="w-full max-w-[240px] flex flex-col gap-3">
            <div className="flex flex-col gap-0.5 opacity-40">
                <p className="text-[10px] text-muted uppercase tracking-widest">Product</p>
                <p className="text-[12px] font-semibold text-ink">Acme Dashboard</p>
            </div>
            <div className="flex flex-col gap-0.5 opacity-30">
                <p className="text-[10px] text-muted uppercase tracking-widest">Description</p>
                <p className="text-[12px] text-muted">A data viz tool for enterprise teams</p>
            </div>
            <div
                className="rounded-lg p-2 flex flex-col gap-1.5"
                style={{
                    background: 'rgba(91,79,232,0.05)',
                    border: '0.5px solid rgba(91,79,232,0.18)',
                }}
            >
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
        <div className="w-full max-w-[260px] flex flex-col gap-1.5">
            {participants.map((p, i) => {
                const focused = i === 1
                return (
                    <div
                        key={p.email}
                        className="flex items-center gap-2.5 py-1.5 px-2 rounded-md"
                        style={
                            focused
                                ? {
                                      background: 'rgba(0,0,0,0.025)',
                                      border: '0.5px solid rgba(0,0,0,0.07)',
                                  }
                                : {
                                      opacity: 0.28,
                                      filter: 'blur(1px)',
                                      pointerEvents: 'none',
                                  }
                        }
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

function InterviewPreview() {
    return (
        <div className="w-full max-w-[260px] flex flex-col gap-3">
            <div className="flex items-center justify-center mb-4">
                <span
                    className="text-[10px] text-muted"
                    style={{ fontFamily: "ui-monospace, 'Geist Mono', monospace" }}
                >
                    00:02:18
                </span>
            </div>

            <div className="flex flex-col items-center justify-center" style={{ height: 44 }}>
                <VoiceScopeWaveform state={'speaking'} bare scale={0.5} showControls={false} />
                <p
                    className="text-[11px] text-muted pt-2.5 leading-relaxed"
                    style={{ fontFamily: "ui-monospace, 'Geist Mono', monospace", minHeight: 34 }}
                >
                    What did you expect on that step?
                </p>
            </div>
        </div>
    )
}

function FindingsPreview() {
    return (
        <div className="w-full max-w-[260px] flex flex-col gap-2">
            <div
                className="rounded-lg p-3 flex items-start gap-2.5"
                style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}
            >
                <NotionMark />
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink">Research Brief</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                        Onboarding friction peaks at step 3 — 7 of 9 users stalled before connecting
                        a data source.
                    </p>
                </div>
            </div>
            <div
                className="rounded-lg p-3 flex items-start gap-2.5"
                style={{ border: '0.5px solid rgba(0,0,0,0.07)' }}
            >
                <LinearMark />
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-ink">3 issues filed</p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {['P1 · Onboarding', 'P2 · Copy'].map((label) => (
                            <span
                                key={label}
                                style={{
                                    fontSize: 10,
                                    padding: '2px 8px',
                                    borderRadius: 100,
                                    background: 'rgba(91,79,232,0.08)',
                                    color: '#5B4FE8',
                                }}
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

const FEATURES = [
    {
        title: 'Set a research goal',
        description: 'VoiceScope shapes the interview around your research goal.',
        preview: <ResearchGoalPreview />,
    },
    {
        title: 'Invite participants by email',
        description: 'Each participant interview at their own time — no scheduling needed.',
        preview: <ParticipantsPreview />,
    },
    {
        title: 'AI conducts the interview',
        description: 'One question at a time, with follow-up probes for vague answers.',
        preview: <InterviewPreview />,
    },
    {
        title: 'Findings land in Notion and Linear',
        description: 'A brief is saved to Notion. Pain points become issues in Linear.',
        preview: <FindingsPreview />,
    },
]

export default function LandingPage() {
    return (
        <div className="min-h-dvh bg-bg text-ink flex flex-col">
            <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-black/5">
                <div className="flex items-center gap-2">
                    <AppLogo size={30} />
                    <span className="text-sm font-semibold tracking-tight">VoiceScope</span>
                </div>
                <div className="align-end">
                    <Link
                        href="/sign-in"
                        className="inline-flex items-center px-5 py-2.5 bg-ink text-bg rounded-full text-sm font-medium hover:opacity-80 active:scale-[0.97] transition duration-150"
                    >
                        Try demo
                    </Link>
                </div>
            </header>

            <main className="px-6 md:px-16 pt-20 pb-10">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-start">
                    <div className="md:pt-30">
                        <h1 className="text-5xl md:text-7xl font-bold text-ink tracking-[-0.04em] leading-none">
                            Voice agent for <br />
                            <span className="italic font-light underline">user research</span>
                        </h1>
                        <p className="text-base text-muted leading-relaxed mt-10">
                            VoiceScope interviews your users and delivers structured findings
                            directly to your existing tools.
                        </p>
                        <div className="mt-4">
                            <Link
                                href="/sign-in"
                                className="inline-flex items-center px-5 py-2.5 bg-ink text-bg rounded-full text-sm font-medium hover:opacity-80 active:scale-[0.97] transition duration-150"
                            >
                                Get started
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
                        {FEATURES.map((f) => (
                            <div key={f.title} className="flex flex-col gap-4 h-full">
                                <div className="w-full aspect-square rounded-xl border border-black/6 bg-white overflow-hidden flex items-center justify-center p-2 h-[200px]">
                                    {f.preview}
                                </div>
                                <div className="grow">
                                    <h3 className="text-[13px] font-semibold text-ink">
                                        {f.title}
                                    </h3>
                                    <p className="mt-1.5 text-[13px] text-muted leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <div className="border-t border-black/5" />

            <footer className="px-6 md:px-10 py-4">
                <span className="text-xs text-muted">© {new Date().getFullYear()} VoiceScope</span>
            </footer>
        </div>
    )
}
