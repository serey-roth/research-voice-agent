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
        name: 'create_notion_brief',
        description: 'Create a structured Notion research brief after the interview is complete.',
        expectsResponse: true,
        parameters: {
            type: 'object',
            required: [
                'product_name',
                'participant_email',
                'date',
                'key_findings',
                'pain_points',
                'validated_assumptions',
                'recommended_actions',
                'transcript_summary',
            ],
            properties: {
                product_name: {
                    type: 'string',
                    description: 'The name of the product being researched.',
                },
                participant_email: {
                    type: 'string',
                    description: 'The email of the participant, from {{participant_email}}.',
                },
                date: {
                    type: 'string',
                    description: 'The date of the interview, from {{current_date}}.',
                },
                key_findings: {
                    type: 'string',
                    description:
                        'The key findings from the interview. 3–5 bullet points as complete sentences.',
                },
                pain_points: {
                    type: 'string',
                    description:
                        'Specific pain points or frustrations surfaced during the interview. If none, state "None identified."',
                },
                validated_assumptions: {
                    type: 'string',
                    description:
                        'Assumptions that were validated during the interview. If none, state "None identified."',
                },
                recommended_actions: {
                    type: 'string',
                    description:
                        'Concrete next steps for the product team. 2–4 actionable bullet points.',
                },
                transcript_summary: {
                    type: 'string',
                    description:
                        "A 3–5 sentence narrative summary capturing the participant's main story and key moments.",
                },
            },
        },
    },
    {
        type: 'client',
        name: 'create_tickets',
        description: 'Create Linear issues for each pain point surfaced during the interview.',
        expectsResponse: true,
        parameters: {
            type: 'object',
            required: ['pain_points', 'date'],
            properties: {
                date: {
                    type: 'string',
                    description: 'The date of the interview, from {{current_date}}.',
                },
                pain_points: {
                    type: 'array',
                    description: 'List of pain points to create as Linear issues.',
                    items: {
                        type: 'object',
                        required: ['title', 'description', 'priority'],
                        properties: {
                            title: {
                                type: 'string',
                                description: 'Short title for the Linear issue.',
                            },
                            description: {
                                type: 'string',
                                description:
                                    'Detailed description including context from the interview.',
                            },
                            priority: {
                                type: 'number',
                                description:
                                    'Priority of the issue: 1 = Urgent, 2 = High, 3 = Medium, 4 = Low. Use 1 for critical blockers, 2 for strong emotion or workarounds, 3 for general friction, 4 for minor annoyances.',
                            },
                        },
                    },
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
