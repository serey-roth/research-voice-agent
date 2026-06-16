'use client'

import { useConversation } from '@elevenlabs/react'
import { useEffect, useRef, useState } from 'react'
import { Orb } from 'orb-ui'
import type { OrbState } from 'orb-ui'
import { createNotionBrief, createTickets, completeSession, recordUsage } from '@/app/actions'

interface Session {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmail: string
}

const CONNECT_TIMEOUT_MS = 15000

export function Conversation({ session, sessionId }: { session: Session; sessionId: string }) {
    const hasStartedRef = useRef(false)
    const conversationIdRef = useRef<string | null>(null)
    const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [hasEnded, setHasEnded] = useState(false)
    const [micError, setMicError] = useState(false)
    const [sessionError, setSessionError] = useState(false)
    const [connectTimedOut, setConnectTimedOut] = useState(false)

    const clientTools = {
        create_notion_brief: async (params: {
            product_name: string
            product_description: string
            research_goal: string
            participant_email: string
            date: string
            key_findings: string
            pain_points: string
            recommended_actions: string
            transcript_summary: string
        }) => {
            const { url, status } = await createNotionBrief(params, sessionId)
            await completeSession(sessionId, { notionUrl: url, notionStatus: status })
            return url ?? ''
        },
        create_tickets: async (params: {
            product_name: string
            date: string
            pain_points: {
                title: string
                description: string
                priority: 1 | 2 | 3 | 4
            }[]
        }) => {
            const { count, url, status } = await createTickets(params, sessionId)
            await completeSession(sessionId, { ticketsUrl: url, ticketsStatus: status })
            return JSON.stringify({ count, url })
        },
    }

    const conversation = useConversation({
        onConnect: ({ conversationId }) => {
            hasStartedRef.current = true
            conversationIdRef.current = conversationId
            if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current)
                connectTimeoutRef.current = null
            }
        },
        onDisconnect: () => {
            if (!hasStartedRef.current) return
            setHasEnded(true)
            completeSession(sessionId, {})
            if (conversationIdRef.current) {
                recordUsage(conversationIdRef.current, sessionId)
            }
        },
        onError: () => {
            setSessionError(true)
            if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current)
                connectTimeoutRef.current = null
            }
        },
    })

    const { status, isSpeaking } = conversation
    const isConnecting = status === 'connecting'
    const isConnected = status === 'connected'
    const isActive = isConnecting || isConnected

    // Best-effort: end session on tab close so onDisconnect fires and usage is recorded
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isActive) conversation.endSession()
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [conversation, isActive])

    const startConversation = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true })
            setMicError(false)
            setSessionError(false)
            setConnectTimedOut(false)

            connectTimeoutRef.current = setTimeout(() => {
                conversation.endSession()
                setConnectTimedOut(true)
            }, CONNECT_TIMEOUT_MS)

            conversation.startSession({
                agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
                userId: sessionId,
                dynamicVariables: {
                    product_name: session.productName,
                    product_description: session.productDescription,
                    research_goal: session.researchGoal,
                    seed_questions: session.seedQuestions.join(', '),
                    participant_email: session.participantEmail,
                    current_date: new Date().toISOString().split('T')[0],
                },
                clientTools,
            })
        } catch (error) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                setMicError(true)
            }
        }
    }

    const stopConversation = () => {
        conversation.endSession()
    }

    const orbState: OrbState = isConnecting
        ? 'connecting'
        : isConnected
          ? isSpeaking
              ? 'speaking'
              : 'listening'
          : 'idle'

    if (hasEnded) {
        return (
            <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                <div className="w-8 h-8 rounded-full bg-surface border border-neutral-200 flex items-center justify-center mb-1">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <p className="text-sm font-medium text-ink">Thanks for your time.</p>
                <p className="text-[13px] text-muted leading-relaxed">
                    Your responses have been recorded.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-10 text-center">
            {!isActive && (
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-xl font-semibold text-ink tracking-tight">
                        You&rsquo;re all set
                    </h1>
                    <p className="text-sm text-muted max-w-xs">
                        Speak naturally and take your time. There are no right or wrong answers.
                    </p>
                </div>
            )}

            <div className="flex flex-col items-center gap-5">
                <Orb
                    state={orbState}
                    theme="circle"
                    size={120}
                    onStart={startConversation}
                    onStop={stopConversation}
                    aria-label={isActive ? 'End interview' : 'Start interview'}
                />

                {isActive && (
                    <p className="text-[13px] text-muted">
                        {isConnecting ? 'Getting ready…' : isSpeaking ? 'Speaking' : 'Listening'}
                    </p>
                )}

                {!isActive && !sessionError && !connectTimedOut && (
                    <p className="text-[12px] text-muted">Click to start</p>
                )}
            </div>

            {micError && (
                <p className="text-sm text-red-600 max-w-xs">
                    Microphone access was denied. Please allow mic access in your browser settings
                    and try again.
                </p>
            )}

            {(sessionError || connectTimedOut) && (
                <p className="text-sm text-red-600 max-w-xs">
                    Something went wrong connecting to the interview. Please refresh the page and
                    try again.
                </p>
            )}
        </div>
    )
}
