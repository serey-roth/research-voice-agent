import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'

export default async function SignUpPage() {
    const { userId } = await auth()
    if (userId) redirect('/home')

    return (
        <main className="min-h-screen flex items-center justify-center">
            <SignUp />
        </main>
    )
}
