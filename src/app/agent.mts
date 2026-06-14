import 'dotenv/config'
import { ElevenLabsClient, ElevenLabs } from '@elevenlabs/elevenlabs-js'
import { prompt, AGENT_ID } from './prompt.mts'

const elevenlabs = new ElevenLabsClient()

const tools: ElevenLabs.PromptAgentApiModelOutputToolsItem[] = [
    {
        type: 'system',
        name: 'end_call',
        description: `
            End the call after the moderator has delivered the  
            closing statement and all research topics have been 
            covered
        `,
        params: {
            systemToolType: 'end_call',
        },
    },
    {
        type: 'client',
        name: 'createDoc',
        description:
            'Create a structured Google Doc research brief after the interview is complete.',
        expectsResponse: true,
        parameters: {
            type: 'object',
            required: [
                'product_name',
                'key_findings',
                'validated_assumptions',
                'open_questions',
                'recommended_actions',
                'transcript_summary',
            ],
            properties: {
                product_name: {
                    type: 'string',
                    description: 'The name of the product being researched.',
                },
                key_findings: {
                    type: 'string',
                    description: 'The key findings from the interview.',
                },
                validated_assumptions: {
                    type: 'string',
                    description: 'Assumptions that were validated during the interview.',
                },
                open_questions: {
                    type: 'string',
                    description: 'Questions that remain unanswered or need further research.',
                },
                recommended_actions: {
                    type: 'string',
                    description: 'Recommended next actions based on the interview findings.',
                },
                transcript_summary: {
                    type: 'string',
                    description: 'A concise summary of the full interview transcript.',
                },
            },
        },
    },
]

async function createAgent() {
    const agent = await elevenlabs.conversationalAi.agents.create({
        name: 'Research Moderator Agent',
        tags: ['test'],
        conversationConfig: {
            tts: {
                voiceId: 'c6SfcYrb2t09NHXiT80T',
                modelId: 'eleven_flash_v2',
            },
            agent: {
                firstMessage:
                    "Hi! Thanks for taking the time to chat. I'm going to ask you a few questions about {{product_name}} — there are no right or wrong answers, I just want to hear your honest experience. Ready to get started?",
                prompt: { prompt, tools },
            },
        },
    })
    console.log('Agent created:', agent)
}

async function updateAgent() {
    const agent = await elevenlabs.conversationalAi.agents.update(AGENT_ID, {
        conversationConfig: {
            agent: {
                prompt: { prompt, tools },
            },
        },
    })
    console.log('Agent updated:', agent.agentId)
}

const command = process.argv[2]

if (command === 'create') {
    createAgent()
} else if (command === 'update') {
    updateAgent()
} else {
    console.log('Usage: node createAgent.mts <create|update>')
}
