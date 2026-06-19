declare const pendo:
    | {
          track(event: string, properties?: Record<string, string | number | boolean>): void
      }
    | undefined

declare namespace NodeJS {
    interface ProcessEnv {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: string
        CLERK_SECRET_KEY: string
        CLERK_WEBHOOK_SECRET: string
        NEXT_PUBLIC_CLERK_SIGN_IN_URL: string
        NEXT_PUBLIC_CLERK_SIGN_UP_URL: string
        NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: string
        NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: string

        UPSTASH_REDIS_REST_URL: string
        UPSTASH_REDIS_REST_TOKEN: string

        ELEVENLABS_API_KEY: string
        ELEVENLABS_AGENT_ID: string
        NEXT_PUBLIC_ELEVENLABS_AGENT_ID: string
        ELEVENLABS_AGENT_VOICE_ID: string
        ELEVENLABS_USAGE_CAP_SECONDS?: string

        NOTION_CLIENT_ID: string
        NOTION_CLIENT_SECRET: string

        LINEAR_CLIENT_ID: string
        LINEAR_CLIENT_SECRET: string

        NEXT_PUBLIC_APP_URL: string
        NEXT_PUBLIC_APP_SUPPORT_EMAIL?: string
    }
}
