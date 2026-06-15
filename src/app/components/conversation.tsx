'use client'

import { useConversation } from '@elevenlabs/react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createNotionBrief, createTickets, completeSession } from '@/app/actions'

interface Session {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmail: string
}

export function Conversation({ session, sessionId }: { session: Session; sessionId: string }) {
    const hasStartedRef = useRef(false)
    const [hasEnded, setHasEnded] = useState(false)
    const [micError, setMicError] = useState(false)

    const clientTools = useMemo(
        () => ({
            create_notion_brief: async (params: {
                product_name: string
                participant_email: string
                date: string
                key_findings: string
                pain_points: string
                validated_assumptions: string
                recommended_actions: string
                transcript_summary: string
            }) => {
                const { url, status } = await createNotionBrief(params)
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
                const { count, url, status } = await createTickets(params)
                await completeSession(sessionId, { ticketsUrl: url, ticketsStatus: status })
                return JSON.stringify({ count, url })
            },
        }),
        [sessionId]
    )

    const conversation = useConversation({
        onConnect: () => {
            hasStartedRef.current = true
        },
        onDisconnect: () => {
            if (hasStartedRef.current) setHasEnded(true)
        },
        onError: () => {},
    })

    const startConversation = useCallback(async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true })
            setMicError(false)
            conversation.startSession({
                agentId: 'agent_7001ktysmmsked2bzjkmdvjqwp1j',
                userId: 'test-user-0',
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
    }, [conversation, clientTools, session])

    const stopConversation = useCallback(async () => {
        conversation.endSession()
    }, [conversation])

    const isConnected = conversation.status === 'connected'

    if (hasEnded) {
        return (
            <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-base font-medium text-ink">Thanks for your time.</p>
                <p className="text-sm text-muted">Your responses have been saved.</p>
            </div>
        )
    }

    if (isConnected) {
        return (
            <div className="flex flex-col items-center gap-10">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative flex items-center justify-center w-10 h-10">
                        {conversation.isSpeaking && (
                            <span className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping" />
                        )}
                        <span
                            className={`w-5 h-5 rounded-full transition-colors duration-300 ${
                                conversation.isSpeaking ? 'bg-primary' : 'bg-neutral-300'
                            }`}
                        />
                    </div>
                    <p className="text-sm text-muted">
                        {conversation.isSpeaking ? 'Speaking…' : 'Listening…'}
                    </p>
                </div>

                <button
                    onClick={stopConversation}
                    className="text-[13px] text-muted hover:text-ink transition-colors"
                >
                    End interview early
                </button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-8 text-center">
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-xl font-semibold text-ink tracking-tight">
                    You&rsquo;re all set
                </h1>
                <p className="text-sm text-muted max-w-xs">
                    Speak naturally and take your time. There are no right or wrong answers.
                </p>
            </div>

            {micError && (
                <p className="text-sm text-red-600 max-w-xs">
                    Microphone access was denied. Please allow mic access in your browser settings and try again.
                </p>
            )}

            <button
                onClick={startConversation}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-[6px] transition-colors cursor-pointer"
            >
                Start interview
            </button>
        </div>
    )
}
