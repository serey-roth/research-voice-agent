'use client'

import { useState } from 'react'

export type AgentState = 'idle' | 'listening' | 'speaking' | 'processing'

const STATES: Record<
    AgentState,
    {
        label: string
        badge: string
        badgeBg: string
        badgeColor: string
        title: string
        transcript: string
        speaker: string
    }
> = {
    idle: {
        label: 'voicescope · ready',
        badge: 'Idle',
        badgeBg: '#F1EFE8',
        badgeColor: '#5F5E5A',
        title: 'Waiting for participant',
        speaker: 'agent',
        transcript: "Hi! Click the mic whenever you're ready.",
    },
    listening: {
        label: 'voicescope · 00:01:42',
        badge: 'Listening',
        badgeBg: '#E1F5EE',
        badgeColor: '#0F6E56',
        title: 'User is speaking',
        speaker: 'user',
        transcript: "The onboarding was really confusing — I didn't know what came next…",
    },
    speaking: {
        label: 'voicescope · 00:02:18',
        badge: 'Agent speaking',
        badgeBg: '#EEEDFE',
        badgeColor: '#3C3489',
        title: 'Probing deeper',
        speaker: 'agent',
        transcript: 'What did you expect to see on that step?',
    },
    processing: {
        label: 'voicescope · session complete',
        badge: 'Processing',
        badgeBg: '#EEEDFE',
        badgeColor: '#3C3489',
        title: 'Generating outputs',
        speaker: 'system',
        transcript: 'Extracting themes · writing Notion brief · filing 3 Linear issues…',
    },
}

const BAR_HEIGHTS: Record<AgentState, number[]> = {
    idle: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    listening: [10, 22, 40, 56, 64, 52, 60, 44, 58, 36, 24, 12],
    speaking: [8, 30, 52, 44, 64, 38, 56, 28, 48, 20, 36, 12],
    processing: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
}

const BAR_COLOR: Record<AgentState, string> = {
    idle: '#D3D1C7',
    listening: '#1D9E75',
    speaking: '#7F77DD',
    processing: '#D3D1C7',
}

const ANIMATION_DURATION: Record<AgentState, string> = {
    idle: '0s',
    listening: '1.2s',
    speaking: '0.8s',
    processing: '1.6s',
}

const css = `
  @keyframes vsWave {
    0%, 100% { transform: scaleY(0.35); opacity: 0.5; }
    50%       { transform: scaleY(1);    opacity: 1;   }
  }
  @keyframes vsShimmer {
    0%, 100% { height: 4px;  opacity: 0.3; background: #D3D1C7; }
    50%       { height: 20px; opacity: 1;   background: #7F77DD; }
  }
  @keyframes vsBlink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .vs-bar-animate {
    animation: vsWave var(--dur) ease-in-out infinite;
    transform-origin: center center;
  }
  .vs-bar-shimmer {
    animation: vsShimmer 1.6s ease-in-out infinite;
    transform-origin: center center;
  }
  .vs-cursor {
    display: inline-block;
    width: 1.5px;
    height: 13px;
    background: #7F77DD;
    margin-left: 2px;
    vertical-align: middle;
    animation: vsBlink 0.9s step-end infinite;
  }
`

interface WaveformBarProps {
    state: AgentState
    height: number
    delay: number
}

function WaveformBar({ state, height, delay }: WaveformBarProps) {
    const isProcessing = state === 'processing'
    const isIdle = state === 'idle'
    const isAnimated = !isIdle

    const baseStyle: React.CSSProperties = {
        width: 4,
        borderRadius: 3,
        flexShrink: 0,
        height: isProcessing ? 4 : height,
        background: BAR_COLOR[state],
        transition:
            'height 300ms cubic-bezier(0.23, 1, 0.32, 1), background 300ms cubic-bezier(0.23, 1, 0.32, 1)',
    }

    if (!isAnimated) return <div style={baseStyle} />

    if (isProcessing) {
        return (
            <div className="vs-bar-shimmer" style={{ ...baseStyle, animationDelay: `${delay}s` }} />
        )
    }

    return (
        <div
            className="vs-bar-animate"
            style={{
                ...baseStyle,
                ['--dur' as string]: ANIMATION_DURATION[state],
                animationDelay: `${delay}s`,
            }}
        />
    )
}

const DELAYS = [0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.7, 0.77]
const PROCESSING_DELAYS = [0, 0.13, 0.26, 0.39, 0.52, 0.65, 0.78, 0.91, 1.04, 1.17, 1.3, 1.43]

interface VoiceScopeWaveformProps {
    state?: AgentState
    onStateChange?: (state: AgentState) => void
    showControls?: boolean
    /** Renders only the waveform bars — no card, label, badge, or transcript */
    bare?: boolean
    /** Bar size multiplier when bare=true (default 1) */
    scale?: number
    /** Overrides the label in the top-left of the card (e.g. live timer) */
    labelOverride?: string
    /** Overrides the transcript line shown at the bottom of the card */
    transcriptOverride?: string
    /** Overrides the speaker label shown before the transcript */
    speakerOverride?: string
}

export default function VoiceScopeWaveform({
    state: controlledState,
    onStateChange,
    showControls = true,
    bare = false,
    scale = 1,
    labelOverride,
    transcriptOverride,
    speakerOverride,
}: VoiceScopeWaveformProps) {
    const [internalState, setInternalState] = useState<AgentState>('listening')
    const state = controlledState ?? internalState

    function handleStateChange(s: AgentState) {
        setInternalState(s)
        onStateChange?.(s)
    }

    const s = STATES[state]
    const heights = BAR_HEIGHTS[state]
    const delays = state === 'processing' ? PROCESSING_DELAYS : DELAYS

    const label = labelOverride ?? s.label
    const transcript = transcriptOverride ?? s.transcript
    const speaker = speakerOverride ?? s.speaker

    if (bare) {
        return (
            <>
                <style>{css}</style>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3 * scale,
                    }}
                    aria-hidden="true"
                >
                    {heights.map((h, i) => (
                        <WaveformBar key={i} state={state} height={h * scale} delay={delays[i]} />
                    ))}
                </div>
            </>
        )
    }

    return (
        <>
            <style>{css}</style>
            <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {showControls && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {(['idle', 'listening', 'speaking', 'processing'] as AgentState[]).map(
                            (k) => (
                                <button
                                    key={k}
                                    onClick={() => handleStateChange(k)}
                                    style={{
                                        fontSize: 12,
                                        padding: '5px 13px',
                                        borderRadius: 100,
                                        border: `0.5px solid ${state === k ? '#888780' : '#D3D1C7'}`,
                                        background: state === k ? '#F1EFE8' : 'transparent',
                                        color: state === k ? '#181816' : '#6B6A66',
                                        fontWeight: state === k ? 500 : 400,
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        transition:
                                            'transform 120ms cubic-bezier(0.23,1,0.32,1), opacity 150ms',
                                    }}
                                    onMouseDown={(e) =>
                                        (e.currentTarget.style.transform = 'scale(0.97)')
                                    }
                                    onMouseUp={(e) =>
                                        (e.currentTarget.style.transform = 'scale(1)')
                                    }
                                >
                                    {k.charAt(0).toUpperCase() + k.slice(1)}
                                </button>
                            )
                        )}
                    </div>
                )}

                <div
                    style={{
                        background: '#FFFFFF',
                        border: '0.5px solid #E2E0DC',
                        borderRadius: 12,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                    }}
                >
                    {/* Top bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <span
                            style={{
                                fontSize: 11,
                                color: '#888780',
                                fontFamily: "ui-monospace, 'Geist Mono', monospace",
                                letterSpacing: '0.04em',
                                transition: 'opacity 200ms',
                            }}
                        >
                            {label}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                padding: '3px 10px',
                                borderRadius: 100,
                                background: s.badgeBg,
                                color: s.badgeColor,
                                transition:
                                    'background 250ms cubic-bezier(0.23,1,0.32,1), color 250ms cubic-bezier(0.23,1,0.32,1)',
                            }}
                        >
                            {s.badge}
                        </span>
                    </div>

                    {/* Title */}
                    <div>
                        <div
                            style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: '#181816',
                                marginBottom: 3,
                                transition: 'opacity 200ms',
                            }}
                        >
                            {s.title}
                        </div>
                    </div>

                    {/* Waveform */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                            height: 64,
                        }}
                        aria-hidden="true"
                    >
                        {heights.map((h, i) => (
                            <WaveformBar key={i} state={state} height={h} delay={delays[i]} />
                        ))}
                    </div>

                    {/* Transcript */}
                    <div
                        style={{
                            fontFamily: "ui-monospace, 'Geist Mono', monospace",
                            fontSize: 12,
                            color: '#636260',
                            lineHeight: 1.6,
                            borderTop: '0.5px solid #E2E0DC',
                            paddingTop: 12,
                        }}
                    >
                        <span style={{ color: '#181816', fontWeight: 500 }}>{speaker}:</span>{' '}
                        &ldquo;{transcript}&rdquo;
                        {(state === 'listening' || state === 'speaking') && (
                            <span className="vs-cursor" />
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
