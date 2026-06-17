# Voice Scope

Voice Scope runs user interviews for you. An AI agent conducts the conversation, then automatically generates a Notion research brief and files Linear issues from the pain points.

## Stack

- **Next.js** (App Router) — frontend + server actions
- **ElevenLabs** — voice agent conducts the interview (STT / LLM / TTS)
- **Clerk** — authentication
- **Upstash Redis** — project, session, and user state
- **Notion** — research brief output
- **Linear** — pain point issues

## How it works

1. Founder creates a project and shares a link with participants
2. Participant opens the link — the AI voice agent conducts the interview
3. Agent auto-generates a Notion research brief and files Linear issues from pain points

## Setup

1. Clone the repo and install dependencies
2. Copy `.env.example` → `.env.local` and fill in credentials
3. Run `npm run dev`
