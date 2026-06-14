'use client'

import { useConversation } from '@elevenlabs/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

const TEST_DATA = {
    productName: 'Loom',
    productDescription: 'A video messaging tool for async team communication',
    researchGoal: 'Understand why new users stop recording after their first week',
    seedQuestions: [
        'What made you try Loom in the first place?',
        'Walk me through the last time you recorded a video',
        'Was there ever a moment you almost gave up on it?',
        'What would have to change for you to use it every day?',
    ],
}

export function Conversation() {
    const [docUrl, setDocUrl] = useState<string | null>(null)
    const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null)

    useEffect(() => {
        fetch('/api/usage')
            .then((r) => r.json())
            .then(setUsage)
            .catch(() => null)
    }, [])
    
    const clientTools = useMemo(
        () => ({
            createDoc: async (params: {
                product_name: string
                key_findings: string
                validated_assumptions: string
                open_questions: string
                recommended_actions: string
                transcript_summary: string
            }) => {
                const response = await fetch('/api/create_doc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params),
                })
                const data = await response.json()
                setDocUrl(data.url)
                return data.url as string
            },
        }),
        []
    )

    const conversation = useConversation({
        onConnect: () => console.log('Connected'),
        onDisconnect: () => console.log('Disconnected'),
        onMessage: (message) => console.log('Message:', message),
        onError: (error) => console.error('Error:', error),
    })

    const startConversation = useCallback(async () => {
        try {
            // Request microphone permission
            await navigator.mediaDevices.getUserMedia({ audio: true })

            await conversation.startSession({
                agentId: 'agent_7001ktysmmsked2bzjkmdvjqwp1j',
                userId: 'test-user-0',
                dynamicVariables: {
                    product_name: TEST_DATA.productName,
                    product_description: TEST_DATA.productDescription,
                    research_goal: TEST_DATA.researchGoal,
                    seed_questions: TEST_DATA.seedQuestions.join(', '),
                    participant_email: 'rserey34@gmail.com',
                    current_date: new Date().toISOString().split('T')[0],
                },
                clientTools,
            })
        } catch (error) {
            console.error('Failed to start conversation:', error)
        }
    }, [conversation, clientTools])

    const stopConversation = useCallback(async () => {
        await conversation.endSession()
    }, [conversation])

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
                <button
                    onClick={startConversation}
                    disabled={conversation.status === 'connected'}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                    Start Conversation
                </button>
                <button
                    onClick={stopConversation}
                    disabled={conversation.status !== 'connected'}
                    className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
                >
                    Stop Conversation
                </button>
            </div>

            <div className="flex flex-col items-center">
                <p>Status: {conversation.status}</p>
                <p>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
            </div>

            {usage && (
                <p className="text-xs text-gray-400">
                    Credits: {usage.remaining.toLocaleString()} / {usage.limit.toLocaleString()} remaining
                </p>
            )}

            {docUrl && (
                <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    View Research Brief
                </a>
            )}
        </div>
    )
}
