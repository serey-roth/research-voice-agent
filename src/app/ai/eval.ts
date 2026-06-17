import 'dotenv/config'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { llmTests } from './eval/llm-tests.ts'
import { simulationTests } from './eval/simulation-tests.ts'
import { buildToolTests } from './eval/tool-tests.ts'

const elevenlabs = new ElevenLabsClient()

type Filter = 'llm' | 'simulation' | 'tool'
const filter = process.argv[2] as Filter | undefined

async function runEval() {
    const allTests = [
        ...((!filter || filter === 'llm') ? llmTests : []),
        ...((!filter || filter === 'simulation') ? simulationTests : []),
        ...((!filter || filter === 'tool') ? await buildToolTests(elevenlabs) : []),
    ]

    console.log('Creating tests…')
    const testIds: string[] = []
    for (const test of allTests) {
        const { type, name, dynamicVariables, ...rest } = test
        const created = await elevenlabs.conversationalAi.tests.create({
            type,
            name,
            dynamicVariables,
            ...rest,
        } as Parameters<typeof elevenlabs.conversationalAi.tests.create>[0])
        testIds.push(created.id)
        console.log(`  ✓ ${name} (${created.id})`)
    }

    console.log('\nRunning tests…')
    const invocation = await elevenlabs.conversationalAi.agents.runTests(process.env.ELEVENLABS_AGENT_ID, {
        tests: testIds.map((id) => ({ testId: id })),
    })
    console.log(`  Invocation: ${invocation.id}`)

    console.log('\nWaiting for results…')
    let result = invocation
    while (result.testRuns.some((r) => r.status === 'pending')) {
        await new Promise((r) => setTimeout(r, 4000))
        const updated = await elevenlabs.conversationalAi.tests.invocations.get(invocation.id)
        result = updated as typeof invocation
        const done = result.testRuns.filter((r) => r.status !== 'pending').length
        process.stdout.write(`\r  ${done}/${result.testRuns.length} complete…`)
    }
    console.log('\n')

    let passed = 0,
        failed = 0
    for (const run of result.testRuns) {
        const icon = run.status === 'passed' ? '✅' : '❌'
        console.log(`${icon} ${run.testName ?? run.testId}`)

        const { summary, messages } = run.conditionResult?.rationale ?? {}
        if (summary) console.log(`   ${summary}`)
        if (messages?.length) messages.forEach((m) => console.log(`   • ${m}`))

        if (run.status !== 'passed') {
            const responses = run.agentResponses ?? []
            if (responses.length) {
                console.log('   Agent transcript:')
                for (const turn of responses) {
                    const role = turn.role === 'agent' ? '  A' : '  U'
                    if (turn.message) console.log(`${role}: ${turn.message}`)
                    if (turn.toolCalls?.length) {
                        for (const tc of turn.toolCalls) {
                            console.log(`  A: [tool call] ${tc.toolName}`)
                        }
                    }
                }
            }
        }

        run.status === 'passed' ? passed++ : failed++ // eslint-disable-line
    }

    console.log(`\n${passed} passed, ${failed} failed`)
    process.exit(failed > 0 ? 1 : 0)
}

runEval().catch((err) => {
    console.error(err)
    process.exit(1)
})
