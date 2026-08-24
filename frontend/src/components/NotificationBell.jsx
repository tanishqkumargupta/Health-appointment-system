import { Bell } from "lucide-react";

export default function NotificationBell() {
    return (
        <button
            type="button"
            className="relative p-2 rounded-full hover:bg-gray-100"
            aria-label="Notifications"
        >
            <Bell size={20} />
        </button>
    );
}