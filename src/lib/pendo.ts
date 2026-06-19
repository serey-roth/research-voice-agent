const PENDO_TRACK_URL = 'https://data.pendo.io/data/track'
const PENDO_INTEGRATION_KEY = '745e2240-b31b-41bb-8b85-242a899dff7d'

export async function pendoTrack(
    event: string,
    visitorId: string,
    properties?: Record<string, string | number | boolean>
) {
    try {
        await fetch(PENDO_TRACK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-pendo-integration-key': PENDO_INTEGRATION_KEY,
            },
            body: JSON.stringify({
                type: 'track',
                event,
                visitorId,
                accountId: visitorId,
                timestamp: Date.now(),
                properties: properties ?? {},
            }),
        })
    } catch (err) {
        console.error('Pendo track error:', err)
    }
}
