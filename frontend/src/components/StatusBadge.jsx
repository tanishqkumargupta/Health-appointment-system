export default function StatusBadge({ status }) {
    const normalizedStatus = String(status || "").toUpperCase();

    const statusClasses = {
        PENDING: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        CONFIRMED: "bg-green-100 text-green-800",
        CANCELLED: "bg-red-100 text-red-800",
        COMPLETED: "bg-blue-100 text-blue-800",
        HELD: "bg-yellow-100 text-yellow-800",
    };

    const className =
        statusClasses[normalizedStatus] ||
        "bg-gray-100 text-gray-800";

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${className}`}
        >
            {status || "Unknown"}
        </span>
    );
}