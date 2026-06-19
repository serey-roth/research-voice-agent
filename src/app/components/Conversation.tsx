'use client'

import { useConversation } from '@elevenlabs/react'
import { useEffect, useRef, useState } from 'react'
import { DateTime } from 'luxon'
import VoiceScopeWaveform, { AgentState } from './VoiceScopeWaveform'
import {
    createBrief,
    createIssues,
    completeSession,
    recordUsage,
    updateSessionStatus,
} from '@/app/actions'

interface Session {
    productName: string
    productDescription: string
    researchGoal: string
    participantEmail: string
}

const CONNECT_TIMEOUT_MS = 15000

export function Conversation({ session, sessionId }: { session: Session; sessionId: string }) {
    const hasStartedRef = useRef(false)
    const conversationIdRef = useRef<string | null>(null)
    const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const startTimeRef = useRef<number | null>(null)

    const [hasEnded, setHasEnded] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [micError, setMicError] = useState(false)
    const [sessionError, setSessionError] = useState(false)
    const [connectTimedOut, setConnectTimedOut] = useState(false)

    const clientTools = {
        create_brief: async (params: {
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
            const { url, status } = await createBrief(params, sessionId)
            await completeSession(sessionId, { briefUrl: url, briefStatus: status })
            if (typeof pendo !== 'undefined') {
                pendo.track('research_brief_generated', {
                    sessionId,
                    productName: params.product_name,
                    status,
                    briefUrl: url ?? '',
                    participantEmail: params.participant_email,
                })
            }
            return url ?? ''
        },
        create_issues: async (params: {
            product_name: string
            date: string
            pain_points: {
                title: string
                description: string
                priority: 1 | 2 | 3 | 4
            }[]
        }) => {
            const { count, url, status } = await createIssues(params, sessionId)
            await completeSession(sessionId, { issuesUrl: url, issuesStatus: status })
            if (typeof pendo !== 'undefined') {
                pendo.track('linear_issues_created', {
                    sessionId,
                    productName: params.product_name,
                    issueCount: count,
                    status,
                    linearProjectUrl: url ?? '',
                    participantEmail: session.participantEmail,
                })
            }
            return JSON.stringify({ count, url })
        },
    }

    const conversation = useConversation({
        onConnect: ({ conversationId }) => {
            hasStartedRef.current = true
            conversationIdRef.current = conversationId
            startTimeRef.current = Date.now()
            if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current)
                connectTimeoutRef.current = null
            }
            updateSessionStatus(sessionId, 'active')
            if (typeof pendo !== 'undefined') {
                pendo.track('interview_started', {
                    sessionId,
                    conversationId,
                    productName: session.productName,
                    participantEmail: session.participantEmail,
                })
            }
        },
        onDisconnect: (details) => {
            if (!hasStartedRef.current) return
            if (details.reason === 'error') {
                updateSessionStatus(sessionId, 'failed', 'Something went wrong with the server.')
                setSessionError(true)
                if (typeof pendo !== 'undefined') {
                    pendo.track('interview_failed', {
                        sessionId,
                        productName: session.productName,
                        errorMessage: 'Something went wrong with the server.',
                        failureReason: 'disconnect_error',
                        elapsedSeconds: startTimeRef.current
                            ? Math.round((Date.now() - startTimeRef.current) / 1000)
                            : 0,
                        participantEmail: session.participantEmail,
                    })
                }
            } else {
                updateSessionStatus(sessionId, 'completed')
                completeSession(sessionId, {})
                setHasEnded(true)
                if (typeof pendo !== 'undefined') {
                    pendo.track('interview_completed', {
                        sessionId,
                        conversationId: conversationIdRef.current ?? '',
                        productName: session.productName,
                        durationSeconds: startTimeRef.current
                            ? Math.round((Date.now() - startTimeRef.current) / 1000)
                            : 0,
                        participantEmail: session.participantEmail,
                    })
                }
            }
            if (conversationIdRef.current) {
                recordUsage(conversationIdRef.current, sessionId)
            }
        },
        onError: (message: string) => {
            setSessionError(true)
            updateSessionStatus(sessionId, 'failed', message)
            if (connectTimeoutRef.current) {
                clearTimeout(connectTimeoutRef.current)
                connectTimeoutRef.current = null
            }
            if (typeof pendo !== 'undefined') {
                pendo.track('interview_failed', {
                    sessionId,
                    productName: session.productName,
                    errorMessage: message.substring(0, 200),
                    failureReason: 'on_error',
                    elapsedSeconds: startTimeRef.current
                        ? Math.round((Date.now() - startTimeRef.current) / 1000)
                        : 0,
                    participantEmail: session.participantEmail,
                })
            }
        },
        onAgentToolResponse: (props) => {
            if (props.tool_name === 'end_call') {
                setHasEnded(true)
            }
        },
    })

    const { status, isSpeaking } = conversation
    const isConnecting = status === 'connecting'
    const isConnected = status === 'connected'
    const isActive = isConnecting || isConnected

    useEffect(() => {
        if (!isConnected) return
        const interval = setInterval(() => {
            if (startTimeRef.current) {
                setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [isConnected])

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
                if (typeof pendo !== 'undefined') {
                    pendo.track('interview_failed', {
                        sessionId,
                        productName: session.productName,
                        errorMessage: 'Connection timed out',
                        failureReason: 'timeout',
                        elapsedSeconds: CONNECT_TIMEOUT_MS / 1000,
                        participantEmail: session.participantEmail,
                    })
                }
            }, CONNECT_TIMEOUT_MS)

            conversation.startSession({
                agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID!,
                userId: sessionId,
                dynamicVariables: {
                    product_name: session.productName,
                    product_description: session.productDescription,
                    research_goal: session.researchGoal,
                    participant_email: session.participantEmail,
                    current_date: DateTime.utc().toISO(),
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

    function formatTime(s: number) {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }

    const waveformState: AgentState = isConnected ? (isSpeaking ? 'speaking' : 'listening') : 'idle'

    if (hasEnded) {
        return (
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <p className="text-lg font-semibold text-ink tracking-tight">
                    Thank you for your time.
                </p>
                <p className="text-[13px] text-muted leading-relaxed">
                    Your feedback has been sent to the researcher.
                </p>
            </div>
        )
    }

    if (sessionError) {
        return (
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <p className="text-lg font-semibold text-ink tracking-tight">
                    Something went wrong.
                </p>
                <p className="text-[13px] text-muted leading-relaxed">
                    Refresh the page and try again. If the issue persists, please contact the
                    researcher.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-12 text-center w-full">
            <div className="h-4">
                {isConnected && (
                    <span className="font-mono text-xs text-muted tracking-widest">
                        {formatTime(elapsed)}
                    </span>
                )}
            </div>

            {!isActive && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted uppercase tracking-widest font-medium">
                        You&apos;ve been invited to share some feedback on
                    </p>
                    <p className="text-3xl font-semibold text-ink tracking-tight">
                        {session.productName}
                    </p>
                    <p className="text-[13px] text-muted leading-relaxed max-w-[200px] mx-auto">
                        Share your honest thoughts and start when you&apos;re ready.
                    </p>
                </div>
            )}

            {isActive && (
                <VoiceScopeWaveform state={waveformState} bare scale={2} showControls={false} />
            )}

            {isActive && isConnecting && <p className="text-[13px] text-muted">Connecting…</p>}

            <div className="flex flex-col items-center gap-3">
                {!isActive && !connectTimedOut && !micError && (
                    <button
                        onClick={startConversation}
                        className="px-6 py-3 bg-ink text-bg text-sm font-medium rounded-full hover:opacity-80 active:scale-[0.97] transition duration-150"
                    >
                        Start interview
                    </button>
                )}
                {isActive && (
                    <button
                        onClick={stopConversation}
                        className="px-6 py-3 border border-neutral-200 text-muted text-sm rounded-full hover:text-ink hover:border-neutral-300 active:scale-[0.97] transition duration-150"
                    >
                        End interview
                    </button>
                )}
                {(micError || connectTimedOut) && (
                    <p className="text-[13px] text-red-500 max-w-[240px] leading-relaxed">
                        {micError
                            ? 'Microphone access was denied. Allow mic access in your browser settings and try again.'
                            : 'Something went wrong. Please refresh the page and try again.'}
                    </p>
                )}
            </div>
        </div>
    )
}
