export default function ConfirmModal({
    isOpen,
    title = "Confirm Action",
    message = "Are you sure you want to continue?",
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel"
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                <h2 className="mb-3 text-xl font-semibold">
                    {title}
                </h2>

                <p className="mb-6 text-gray-600">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border px-4 py-2 hover:bg-gray-100"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}