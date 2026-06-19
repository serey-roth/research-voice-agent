import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignIn } from '@clerk/nextjs'

export default async function SignInPage() {
    const { userId } = await auth()
    if (userId) redirect('/home')

    return (
        <main className="min-h-screen flex items-center justify-center">
            <SignIn />
        </main>
    )
}
