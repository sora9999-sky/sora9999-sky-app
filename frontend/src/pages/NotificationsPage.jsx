import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Bell, AlertOctagon, PackageX, CalendarClock, AlertTriangle, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";

const STYLES = {
    expired: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        accent: "bg-rose-500",
        text: "text-rose-900",
        muted: "text-rose-700",
        Icon: AlertOctagon,
        title: "Expired",
    },
    out_of_stock: {
        bg: "bg-orange-50",
        border: "border-orange-200",
        accent: "bg-orange-500",
        text: "text-orange-900",
        muted: "text-orange-700",
        Icon: PackageX,
        title: "Out of stock",
    },
    expiring_soon: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        accent: "bg-amber-500",
        text: "text-amber-900",
        muted: "text-amber-700",
        Icon: CalendarClock,
        title: "Expiring soon",
    },
    low_stock: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        accent: "bg-yellow-500",
        text: "text-yellow-900",
        muted: "text-yellow-800",
        Icon: AlertTriangle,
        title: "Low stock",
    },
};

const ORDER = ["expired", "out_of_stock", "expiring_soon", "low_stock"];

const NotificationsPage = () => {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmClear, setConfirmClear] = useState(false);
    const navigate = useNavigate();

    const load = async () => {
        try {
            const res = await api.get("/notifications");
            setNotifs(res.data);
        } catch (e) {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const grouped = useMemo(() => {
        const by = {};
        for (const t of ORDER) by[t] = [];
        for (const n of notifs) (by[n.type] || (by[n.type] = [])).push(n);
        return by;
    }, [notifs]);

    const dismiss = async (n) => {
        try {
            await api.post("/notifications/dismiss", {
                item_id: n.item_id,
                type: n.type,
            });
            setNotifs((prev) => prev.filter((x) => x.id !== n.id));
            toast.success("Dismissed");
        } catch (e) {
            toast.error("Could not dismiss");
        }
    };

    const clearAll = async () => {
        try {
            await api.post("/notifications/clear-all", {});
            setNotifs([]);
            toast.success("All notifications cleared");
        } catch (e) {
            toast.error("Could not clear");
        } finally {
            setConfirmClear(false);
        }
    };

    const goToItem = (item_id) => {
        navigate(`/storage?highlight=${item_id}`);
    };

    const total = notifs.length;
    const critical = notifs.filter((n) => n.level === "critical").length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div>
                    <h1 className="font-display text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-rose-500" />
                        Notifications
                    </h1>
                    <p className="text-sm text-stone-500">
                        {total === 0
                            ? "No active alerts — you're all caught up."
                            : `${total} active alert${total === 1 ? "" : "s"}${
                                  critical > 0 ? ` · ${critical} critical` : ""
                              }`}
                    </p>
                </div>
                <div className="md:ml-auto">
                    <Button
                        data-testid="clear-all-notifications"
                        onClick={() => setConfirmClear(true)}
                        disabled={total === 0}
                        variant="outline"
                        className="rounded-xl h-11"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear all
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-stone-400">Loading…</div>
            ) : total === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <Bell className="w-12 h-12 text-emerald-300 mx-auto mb-3" strokeWidth={1.5} />
                    <div className="font-display font-bold text-stone-700">All clear</div>
                    <p className="text-sm text-stone-500 mt-1">
                        Nothing needs your attention right now.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {ORDER.map((type) =>
                        grouped[type] && grouped[type].length > 0 ? (
                            <section key={type}>
                                <h2 className="font-display font-bold text-sm uppercase tracking-wider text-stone-500 mb-2">
                                    {STYLES[type].title} ({grouped[type].length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {grouped[type].map((n) => (
                                        <NotificationCard
                                            key={n.id}
                                            n={n}
                                            onClick={() => goToItem(n.item_id)}
                                            onDismiss={() => dismiss(n)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ) : null
                    )}
                </div>
            )}

            <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                        <AlertDialogDescription>
                            They will reappear in 15 days if the underlying issue (low stock,
                            near expiry, etc.) is still present.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            data-testid="confirm-clear-all"
                            onClick={clearAll}
                            className="bg-rose-500 hover:bg-rose-600 rounded-xl"
                        >
                            Clear all
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const NotificationCard = ({ n, onClick, onDismiss }) => {
    const s = STYLES[n.type] || STYLES.low_stock;
    const { Icon } = s;
    return (
        <div
            data-testid={`notif-${n.id}`}
            className={`relative rounded-2xl border ${s.border} ${s.bg} p-4 pr-12 cursor-pointer hover:shadow-md transition`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" ? onClick() : null)}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-10 h-10 rounded-xl ${s.accent} text-white flex items-center justify-center shrink-0`}
                >
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <div className={`text-xs font-semibold uppercase tracking-wider ${s.muted}`}>
                        {s.title}
                    </div>
                    <div className={`font-semibold ${s.text} mt-0.5 leading-snug`}>
                        {n.message}
                    </div>
                    <div className={`text-xs ${s.muted} mt-1.5`}>
                        Click to view in Storage
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                }}
                data-testid={`dismiss-${n.id}`}
                aria-label="Dismiss"
                className={`absolute top-3 right-3 w-7 h-7 rounded-full bg-white/70 hover:bg-white ${s.muted} flex items-center justify-center btn-soft`}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default NotificationsPage;
