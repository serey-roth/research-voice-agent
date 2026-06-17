export function DeleteModal({
    onConfirm,
    onCancel,
}: {
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <>
            <div className="fixed inset-0 bg-black/20 z-60" onClick={onCancel} />
            <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
                <div className="bg-bg rounded-[10px] border border-neutral-200 shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-[15px] font-semibold text-ink">Delete project</p>
                        <p className="text-[13px] text-muted">
                            This will permanently delete the project and all its sessions. This
                            cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 text-[13px] text-ink border border-neutral-200 rounded-[6px] hover:bg-neutral-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-3 py-1.5 text-[13px] text-white bg-red-500 hover:bg-red-600 rounded-[6px] transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
