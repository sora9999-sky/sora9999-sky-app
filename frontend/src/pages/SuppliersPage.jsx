import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Users, Package, AlertTriangle } from "lucide-react";
import { api, formatIQD, stockSummary } from "@/lib/api";

const SuppliersPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/items");
                setItems(res.data);
            } catch (e) {
                toast.error("Failed to load items");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const groups = useMemo(() => {
        const by = {};
        for (const it of items) {
            const key = (it.supplier && it.supplier.trim()) || "(Unspecified)";
            if (!by[key]) {
                by[key] = {
                    supplier: key,
                    items: [],
                    inventory_value: 0,
                    retail_value: 0,
                    item_count: 0,
                    low_or_out: 0,
                };
            }
            const g = by[key];
            g.items.push(it);
            g.item_count += 1;
            g.inventory_value += (it.buying_price || 0) * (it.stock_qty || 0);
            g.retail_value += (it.selling_price || 0) * (it.stock_qty || 0);
            const lvl = stockSummary(it).level;
            if (lvl === "low" || lvl === "out") g.low_or_out += 1;
        }
        return Object.values(by).sort((a, b) => b.inventory_value - a.inventory_value);
    }, [items]);

    const totalValue = groups.reduce((s, g) => s + g.inventory_value, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl font-bold text-stone-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" />
                    Suppliers
                </h1>
                <p className="text-sm text-stone-500">
                    Inventory value (at buying price) grouped by supplier. New suppliers
                    appear automatically as you add items in Storage.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat label="Suppliers" value={groups.length} color="indigo" />
                <Stat
                    label="Total items"
                    value={items.length}
                    color="emerald"
                />
                <Stat
                    label="Total inventory value"
                    value={formatIQD(totalValue)}
                    color="stone"
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-stone-400">Loading…</div>
            ) : groups.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-100 p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" strokeWidth={1.5} />
                    <div className="font-display font-bold text-stone-700">
                        No suppliers yet
                    </div>
                    <p className="text-sm text-stone-500 mt-1">
                        Add an item in Storage with a supplier name to see the first card.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groups.map((g) => (
                        <SupplierCard key={g.supplier} g={g} totalValue={totalValue} />
                    ))}
                </div>
            )}
        </div>
    );
};

const Stat = ({ label, value, color }) => {
    const map = {
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
        stone: "bg-stone-50 text-stone-700 border-stone-200",
    };
    return (
        <div className={`rounded-2xl border p-5 ${map[color]}`}>
            <div className="text-xs uppercase tracking-wide font-semibold opacity-80">
                {label}
            </div>
            <div className="font-display text-3xl font-bold mt-2">{value}</div>
        </div>
    );
};

const SupplierCard = ({ g, totalValue }) => {
    const pct = totalValue > 0 ? Math.round((g.inventory_value / totalValue) * 100) : 0;
    return (
        <div
            data-testid={`supplier-${g.supplier}`}
            className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition"
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <div className="font-display font-bold text-stone-900 text-lg leading-tight truncate">
                        {g.supplier}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {g.item_count} item{g.item_count === 1 ? "" : "s"}
                        </span>
                        {g.low_or_out > 0 && (
                            <span className="flex items-center gap-1 text-amber-700 font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                {g.low_or_out} low/out
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold whitespace-nowrap">
                    {pct}%
                </div>
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-3">
                <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">
                    Inventory value (cost)
                </div>
                <div className="font-display font-bold text-2xl text-emerald-700 mt-1">
                    {formatIQD(g.inventory_value)}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                    Retail value: {formatIQD(g.retail_value)}
                </div>
            </div>
            <div className="mt-3 max-h-32 overflow-auto text-xs space-y-1 pr-1">
                {g.items.slice(0, 6).map((it) => (
                    <div
                        key={it.id}
                        className="flex justify-between text-stone-600"
                    >
                        <span className="truncate pr-2">{it.name}</span>
                        <span className="whitespace-nowrap text-stone-400">
                            ×{it.stock_qty}
                        </span>
                    </div>
                ))}
                {g.items.length > 6 && (
                    <div className="text-stone-400 italic">
                        + {g.items.length - 6} more
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuppliersPage;
