import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                <p className="text-sm font-medium text-ink">Page not found</p>
                <p className="text-[13px] text-muted leading-relaxed">
                    This page doesn&rsquo;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="text-[13px] text-primary hover:text-primary-hover transition-colors"
                >
                    Back to Home
                </Link>
            </div>
        </main>
    )
}
