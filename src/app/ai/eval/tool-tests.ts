import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { vars, realConversation } from './shared.ts'

async function getToolId(
    elevenlabs: ElevenLabsClient,
    name: string,
): Promise<{ id: string; type: 'client' | 'system' }> {
    const { tools } = await elevenlabs.conversationalAi.tools.list()
    const match = tools.find((t) => {
        const cfg = t.toolConfig
        return (
            (cfg.type === 'client' || cfg.type === 'system' || cfg.type === 'webhook') &&
            cfg.name === name
        )
    })
    if (!match) throw new Error(`Tool not found: ${name}`)
    return { id: match.id, type: match.toolConfig.type as 'client' | 'system' }
}

export async function buildToolTests(elevenlabs: ElevenLabsClient) {
    const briefTool = await getToolId(elevenlabs, 'create_brief')
    const issuesTool = await getToolId(elevenlabs, 'create_issues')

    return [
        {
            type: 'tool' as const,
            name: 'Tool: create_brief called at wrap-up',
            chatHistory: [
                ...realConversation,
                {
                    role: 'agent' as const,
                    timeInCallSecs: 240,
                    message: 'Thank you — this has been really helpful.',
                },
                { role: 'user' as const, timeInCallSecs: 245, message: 'Of course.' },
            ],
            toolCallParameters: {
                referencedTool: { id: briefTool.id, type: briefTool.type },
            },
            dynamicVariables: vars,
        },
        {
            type: 'tool' as const,
            name: 'Tool: create_issues NOT called for vague dissatisfaction',
            chatHistory: [
                {
                    role: 'user' as const,
                    timeInCallSecs: 0,
                    message: 'It was just kind of meh, you know? Nothing specific I can point to.',
                },
                { role: 'agent' as const, timeInCallSecs: 4, message: 'Got it.' },
                { role: 'user' as const, timeInCallSecs: 6, message: 'Yeah, just not for me.' },
                {
                    role: 'agent' as const,
                    timeInCallSecs: 8,
                    message: 'Understood. Thanks for being honest.',
                },
            ],
            toolCallParameters: {
                referencedTool: { id: issuesTool.id, type: issuesTool.type },
                verifyAbsence: true,
            },
            dynamicVariables: vars,
        },
    ]
}
