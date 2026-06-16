'use client'

import { ConversationProvider } from '@elevenlabs/react'
import { Conversation } from '@/app/components/conversation'

interface Session {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmail: string
}

export function Interview({ session, sessionId }: { session: Session; sessionId: string }) {
    return (
        <ConversationProvider>
            <Conversation session={session} sessionId={sessionId} />
        </ConversationProvider>
    )
}
