import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
    const auth = request.headers.get('authorization')

    if (auth) {
        const [type, credentials] = auth.split(' ')
        if (type === 'Basic') {
            const decoded = Buffer.from(credentials, 'base64').toString()
            const password = decoded.split(':').slice(1).join(':')
            if (password === process.env.SESSIONS_PASSWORD) {
                return NextResponse.next()
            }
        }
    }

    return new NextResponse('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Sessions"' },
    })
}

export const config = {
    matcher: '/sessions',
}
