export function ErrorMessage({ message = "Something went wrong." }) {
    return (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {message}
        </div>
    );
}

export function EmptyState({ message = "No data available." }) {
    return (
        <div className="rounded-lg border p-8 text-center text-gray-500">
            {message}
        </div>
    );
}