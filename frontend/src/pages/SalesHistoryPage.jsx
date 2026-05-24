import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Receipt, Trash2, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, formatIQD } from "@/lib/api";

const dayKey = (iso) => iso.slice(0, 10);
const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
const fmtDateTime = (iso) =>
    new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const SalesHistoryPage = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({});
    const [confirmClear, setConfirmClear] = useState(false);

    const load = async () => {
        try {
            const res = await api.get("/sales");
            setSales(res.data);
        } catch (e) {
            toast.error("Failed to load sales");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []);

    const dailySummary = useMemo(() => {
        const by = {};
        for (const s of sales) {
            const k = dayKey(s.created_at);
            if (!by[k]) by[k] = { date: k, total: 0, count: 0, items: 0 };
            by[k].total += s.total || 0;
            by[k].count += 1;
            by[k].items += (s.lines || []).reduce((sum, l) => sum + (l.qty || 0), 0);
        }
        return Object.values(by).sort((a, b) => (a.date < b.date ? 1 : -1));
    }, [sales]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const today = dailySummary.find((d) => d.date === todayKey) || {
        total: 0,
        count: 0,
        items: 0,
    };
    const last7Total = dailySummary
        .slice(0, 7)
        .reduce((sum, d) => sum + d.total, 0);
    const lifetimeTotal = sales.reduce((sum, s) => sum + (s.total || 0), 0);

    const clearAll = async () => {
        try {
            await api.delete("/sales");
            setSales([]);
            toast.success("Sales history cleared");
        } catch (e) {
            toast.error("Could not clear history");
        } finally {
            setConfirmClear(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div>
                    <h1 className="font-display text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-emerald-600" />
                        Sales History
                    </h1>
                    <p className="text-sm text-stone-500">
                        Review past sales and clear the history when needed.
                    </p>
                </div>
                <div className="md:ml-auto">
                    <Button
                        data-testid="clear-history-button"
                        onClick={() => setConfirmClear(true)}
                        disabled={sales.length === 0}
                        variant="outline"
                        className="rounded-xl h-11"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear history
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard
                    label="Today"
                    value={formatIQD(today.total)}
                    sub={`${today.count} sale${today.count === 1 ? "" : "s"} · ${today.items} item${
                        today.items === 1 ? "" : "s"
                    }`}
                    color="emerald"
                    testId="summary-today"
                />
                <SummaryCard
                    label="Last 7 days"
                    value={formatIQD(last7Total)}
                    sub={`${dailySummary.slice(0, 7).reduce((s, d) => s + d.count, 0)} sales`}
                    color="indigo"
                    testId="summary-7d"
                />
                <SummaryCard
                    label="Lifetime"
                    value={formatIQD(lifetimeTotal)}
                    sub={`${sales.length} sale${sales.length === 1 ? "" : "s"}`}
                    color="stone"
                    testId="summary-lifetime"
                />
            </div>

            {/* Daily report */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="font-display text-lg font-bold text-stone-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    Daily report
                </h2>
                {dailySummary.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-sm">
                        No sales yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" data-testid="daily-table">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-stone-500 border-b border-stone-100">
                                    <th className="py-3 px-2 font-semibold">Date</th>
                                    <th className="py-3 px-2 font-semibold text-right">Sales</th>
                                    <th className="py-3 px-2 font-semibold text-right">Items</th>
                                    <th className="py-3 px-2 font-semibold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {dailySummary.map((d) => (
                                    <tr key={d.date} className="hover:bg-stone-50/60">
                                        <td className="py-3 px-2 text-stone-700">
                                            {fmtDate(d.date)}
                                        </td>
                                        <td className="py-3 px-2 text-right text-stone-600">
                                            {d.count}
                                        </td>
                                        <td className="py-3 px-2 text-right text-stone-600">
                                            {d.items}
                                        </td>
                                        <td className="py-3 px-2 text-right font-display font-bold text-emerald-700">
                                            {formatIQD(d.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sale list */}
            <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h2 className="font-display text-lg font-bold text-stone-900 mb-3">
                    All sales ({sales.length})
                </h2>
                {loading ? (
                    <div className="text-center py-8 text-stone-400 text-sm">Loading…</div>
                ) : sales.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-sm">
                        No sales yet.
                    </div>
                ) : (
                    <ul className="divide-y divide-stone-100" data-testid="sales-list">
                        {sales.map((s) => (
                            <li key={s.id} className="py-3" data-testid={`sale-${s.id}`}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpanded((e) => ({ ...e, [s.id]: !e[s.id] }))
                                    }
                                    className="w-full flex items-center justify-between text-left btn-soft hover:bg-stone-50 rounded-lg p-2"
                                >
                                    <div>
                                        <div className="font-semibold text-stone-900 text-sm">
                                            #{s.id.slice(0, 8).toUpperCase()}
                                        </div>
                                        <div className="text-xs text-stone-500">
                                            {fmtDateTime(s.created_at)} ·{" "}
                                            {(s.lines || []).reduce(
                                                (sum, l) => sum + (l.qty || 0),
                                                0
                                            )}{" "}
                                            item
                                            {(s.lines || []).reduce(
                                                (sum, l) => sum + (l.qty || 0),
                                                0
                                            ) === 1
                                                ? ""
                                                : "s"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-display font-bold text-emerald-700">
                                            {formatIQD(s.total)}
                                        </span>
                                        {expanded[s.id] ? (
                                            <ChevronUp className="w-4 h-4 text-stone-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-stone-400" />
                                        )}
                                    </div>
                                </button>
                                {expanded[s.id] && (
                                    <div className="mt-2 ml-2 pl-3 border-l-2 border-stone-100 space-y-1">
                                        {(s.lines || []).map((l, i) => (
                                            <div
                                                key={i}
                                                className="flex justify-between text-sm py-1"
                                            >
                                                <span className="text-stone-700">
                                                    {l.name} × {l.qty}{" "}
                                                    <span className="text-xs text-stone-400">
                                                        ({l.mode || "pack"})
                                                    </span>
                                                </span>
                                                <span className="font-semibold text-stone-700">
                                                    {formatIQD(l.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                        {(s.discount || 0) !== 0 && (
                                            <div className="flex justify-between text-sm py-1 text-stone-500">
                                                <span>
                                                    {s.discount > 0 ? "Discount" : "Surcharge"}
                                                </span>
                                                <span>
                                                    {s.discount > 0 ? "−" : "+"}
                                                    {formatIQD(Math.abs(s.discount))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear sales history?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All past sales records will be permanently deleted. This does
                            not change current stock levels. Consider taking a backup first.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            data-testid="confirm-clear-history"
                            onClick={clearAll}
                            className="bg-rose-500 hover:bg-rose-600 rounded-xl"
                        >
                            Delete all sales
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

const SummaryCard = ({ label, value, sub, color, testId }) => {
    const map = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        stone: "bg-stone-50 text-stone-700 border-stone-200",
    };
    return (
        <div data-testid={testId} className={`rounded-2xl border p-5 ${map[color]}`}>
            <div className="text-xs uppercase tracking-wide font-semibold opacity-80">
                {label}
            </div>
            <div className="font-display text-3xl font-bold mt-2">{value}</div>
            <div className="text-xs opacity-70 mt-1">{sub}</div>
        </div>
    );
};

export default SalesHistoryPage;
