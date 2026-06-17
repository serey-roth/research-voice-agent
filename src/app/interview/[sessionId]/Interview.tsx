'use client'

import { ConversationProvider as ElevenLabsConversationProvider } from '@elevenlabs/react'
import { Conversation } from '@/app/components/Conversation'

interface Session {
    productName: string
    productDescription: string
    researchGoal: string
    seedQuestions: string[]
    participantEmail: string
}

export function Interview({ session, sessionId }: { session: Session; sessionId: string }) {
    return (
        <ElevenLabsConversationProvider>
            <Conversation session={session} sessionId={sessionId} />
        </ElevenLabsConversationProvider>
    )
}
