import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Boxes, Bell, Receipt, Users, Download, Upload, Lock } from "lucide-react";
import RoseIcon from "@/components/RoseIcon";
import PasswordDialog from "@/components/PasswordDialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, IS_DESKTOP } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
    { to: "/cashier", label: "POS", Icon: ShoppingCart, public: true },
    { to: "/storage", label: "Storage", Icon: Boxes },
    { to: "/notifications", label: "Alerts", Icon: Bell, showBadge: true },
    { to: "/sales", label: "Sales", Icon: Receipt },
    { to: "/suppliers", label: "Suppliers", Icon: Users },
];

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { unlocked, unlock } = useAuth();

    const [pwOpen, setPwOpen] = useState(false);
    const [pendingRoute, setPendingRoute] = useState(null);
    const [confirmRestore, setConfirmRestore] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notifCount, setNotifCount] = useState(0);

    // Periodically refresh notification count
    useEffect(() => {
        let mounted = true;
        const fetchCount = async () => {
            try {
                const res = await api.get("/notifications");
                if (mounted) setNotifCount(res.data.length);
            } catch (e) {
                // ignore
            }
        };
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, [location.pathname]);

    const goTo = (to, isPublic) => {
        if (isPublic || unlocked) {
            navigate(to);
        } else {
            setPendingRoute(to);
            setPwOpen(true);
        }
    };

    const onUnlock = () => {
        unlock();
        setPwOpen(false);
        if (pendingRoute) navigate(pendingRoute);
        setPendingRoute(null);
        toast.success("Unlocked");
    };

    const doBackup = async () => {
        if (!window.pharmacyAPI) return;
        try {
            setBusy(true);
            const res = await window.pharmacyAPI.backupSave();
            if (res?.canceled) return;
            toast.success(`Backup saved`, { description: res.path });
        } catch (e) {
            toast.error("Backup failed", { description: e?.message });
        } finally {
            setBusy(false);
        }
    };

    const doRestore = async () => {
        if (!window.pharmacyAPI) return;
        try {
            setBusy(true);
            const res = await window.pharmacyAPI.backupRestore();
            if (res?.canceled) return;
            toast.success("Backup restored", {
                description: `${res.items} items, ${res.sales} sales loaded. Reloading…`,
            });
            setTimeout(() => window.location.reload(), 800);
        } catch (e) {
            toast.error("Restore failed", { description: e?.message });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-stone-100">
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3" data-testid="brand-logo">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-[0_8px_20px_rgba(244,63,94,0.3)]">
                            <RoseIcon className="w-6 h-6 text-white" strokeWidth={1.8} />
                        </div>
                        <div>
                            <div className="font-display font-bold text-lg leading-none text-stone-900">
                                Jory Corner
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5">Pharmacy</div>
                        </div>
                    </div>

                    <nav className="flex items-center gap-1 flex-wrap">
                        {NAV.map(({ to, label, Icon, public: isPublic, showBadge }) => {
                            const isActive = location.pathname === to;
                            const locked = !isPublic && !unlocked;
                            return (
                                <button
                                    key={to}
                                    type="button"
                                    onClick={() => goTo(to, isPublic)}
                                    data-testid={`nav-${label.toLowerCase()}`}
                                    className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors btn-soft ${
                                        isActive
                                            ? "bg-emerald-500 text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)]"
                                            : "text-stone-700 hover:bg-stone-100"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                    {locked && <Lock className="w-3 h-3 opacity-60" />}
                                    {showBadge && notifCount > 0 && (
                                        <span
                                            data-testid="nav-notif-badge"
                                            className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                                isActive
                                                    ? "bg-white text-emerald-700"
                                                    : "bg-rose-500 text-white"
                                            }`}
                                        >
                                            {notifCount > 99 ? "99+" : notifCount}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {IS_DESKTOP && (
                            <>
                                <div className="w-px h-6 bg-stone-200 mx-1" />
                                <button
                                    type="button"
                                    onClick={doBackup}
                                    disabled={busy}
                                    data-testid="backup-button"
                                    title="Save a backup of all data"
                                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors btn-soft text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4" />
                                    Backup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmRestore(true)}
                                    disabled={busy}
                                    data-testid="restore-button"
                                    title="Restore data from backup"
                                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors btn-soft text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                                >
                                    <Upload className="w-4 h-4" />
                                    Restore
                                </button>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">
                <Outlet />
            </main>

            <footer className="text-center text-xs text-stone-400 py-4">
                Jory Corner Pharmacy · prices in IQD{IS_DESKTOP ? " · Offline edition" : ""}
            </footer>

            <PasswordDialog
                open={pwOpen}
                onClose={() => {
                    setPwOpen(false);
                    setPendingRoute(null);
                }}
                onSuccess={onUnlock}
            />

            <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
                <AlertDialogContent className="rounded-2xl" data-testid="restore-confirm-dialog">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore from backup?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will <strong>replace all current data</strong> (items and
                            sales) with the contents of the backup file you select. This
                            cannot be undone.
                            <br />
                            <br />
                            Tip: take a fresh backup first if you're not sure.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel data-testid="restore-cancel" className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            data-testid="restore-confirm"
                            onClick={() => {
                                setConfirmRestore(false);
                                doRestore();
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                        >
                            Choose file & restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Layout;
