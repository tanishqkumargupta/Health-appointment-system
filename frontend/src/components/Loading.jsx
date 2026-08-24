export default function Loading({ message = "Loading..." }) {
    return (
        <div className="flex min-h-[200px] items-center justify-center">
            <div className="text-center">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                <p className="text-sm text-gray-600">{message}</p>
            </div>
        </div>
    );
}