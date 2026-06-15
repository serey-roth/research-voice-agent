import { Client } from '@notionhq/client'

interface NotionBriefBody {
    product_name: string
    participant_email: string
    date: string
    key_findings: string
    pain_points: string
    validated_assumptions: string
    recommended_actions: string
    transcript_summary: string
}

const notion = new Client({ auth: process.env.NOTION_TOKEN })

export async function POST(request: Request) {
    try {
        const body: NotionBriefBody = await request.json()
        const {
            product_name,
            participant_email,
            date,
            key_findings,
            pain_points,
            validated_assumptions,
            recommended_actions,
            transcript_summary,
        } = body

        const title = `${product_name} Research Brief`

        const page = await notion.pages.create({
            parent: { database_id: process.env.NOTION_DATABASE_ID! },
            properties: {
                'Brief Title': {
                    title: [{ text: { content: title } }],
                },
                'Product Name': {
                    rich_text: [{ text: { content: product_name } }],
                },
                'Participant Email': {
                    email: participant_email,
                },
                'Interview Date': {
                    date: { start: date },
                },
            },
            children: [
                heading('Key Findings'),
                paragraph(key_findings),
                heading('Pain Points'),
                paragraph(pain_points),
                heading('Validated Assumptions'),
                paragraph(validated_assumptions),
                heading('Recommended Actions'),
                paragraph(recommended_actions),
                heading('Transcript Summary'),
                paragraph(transcript_summary),
            ],
        })

        const url = `https://notion.so/${page.id.replace(/-/g, '')}`
        return Response.json({ url }, { status: 201 })
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('notion error:', err)
        return Response.json({ error: message }, { status: 500 })
    }
}

function heading(text: string) {
    return {
        object: 'block' as const,
        type: 'heading_2' as const,
        heading_2: { rich_text: [{ type: 'text' as const, text: { content: text } }] },
    }
}

function paragraph(text: string) {
    return {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: { rich_text: [{ type: 'text' as const, text: { content: text } }] },
    }
}
