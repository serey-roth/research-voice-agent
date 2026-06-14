import { google } from 'googleapis'

interface CreateDocBody {
    product_name: string
    key_findings: string
    validated_assumptions: string
    open_questions: string
    recommended_actions: string
    transcript_summary: string
}

export async function POST(request: Request) {
    const body: CreateDocBody = await request.json()
    const {
        product_name,
        key_findings,
        validated_assumptions,
        open_questions,
        recommended_actions,
        transcript_summary,
    } = body

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/documents'],
    })

    const docs = google.docs({ version: 'v1', auth })

    const doc = await docs.documents.create({
        requestBody: { title: `Research Brief: ${product_name}` },
    })

    const documentId = doc.data.documentId!

    const content = [
        `Research Brief: ${product_name}\n`,
        `\nKey Findings\n${key_findings}\n`,
        `\nValidated Assumptions\n${validated_assumptions}\n`,
        `\nOpen Questions\n${open_questions}\n`,
        `\nRecommended Next Actions\n${recommended_actions}\n`,
        `\nTranscript Summary\n${transcript_summary}\n`,
    ].join('')

    await docs.documents.batchUpdate({
        documentId,
        requestBody: {
            requests: [
                {
                    insertText: {
                        location: { index: 1 },
                        text: content,
                    },
                },
            ],
        },
    })

    const docUrl = `https://docs.google.com/document/d/${documentId}`

    return new Response(JSON.stringify({ url: docUrl }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
    })
}
