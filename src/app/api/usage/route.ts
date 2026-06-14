import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'

export async function GET() {
    const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
    const subscription = await elevenlabs.user.subscription.get()

    return Response.json({
        tier: subscription.tier,
        used: subscription.characterCount,
        limit: subscription.characterLimit,
        remaining: subscription.characterLimit - subscription.characterCount,
        resetsAt: subscription.nextCharacterCountResetUnix,
    })
}
