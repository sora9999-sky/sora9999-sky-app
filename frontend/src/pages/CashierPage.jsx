import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, ShoppingBag, CheckCircle2, Barcode, Package, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { api, formatIQD, stockSummary, canAddOne } from "@/lib/api";

const lineKey = (id, mode) => `${id}__${mode}`;
const AUTO_SUBMIT_MS = 250;
const AUTO_SUBMIT_MIN_LEN = 4;

const CashierPage = () => {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [barcodeInput, setBarcodeInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState(null);
    const [pendingItem, setPendingItem] = useState(null);
    const [discount, setDiscount] = useState("");
    const barcodeRef = useRef(null);
    const debounceRef = useRef(null);

    const loadItems = async () => {
        try {
            const res = await api.get("/items");
            setItems(res.data);
        } catch (e) {
            toast.error("Failed to load items");
        }
    };

    useEffect(() => {
        loadItems();
        setTimeout(() => barcodeRef.current?.focus(), 300);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(
            (it) =>
                it.name.toLowerCase().includes(q) ||
                (it.barcode || "").toLowerCase().includes(q) ||
                (it.type || "").toLowerCase().includes(q)
        );
    }, [items, search]);

    const addToCart = (item, mode = "pack") => {
        if (!item) return;
        if (!canAddOne(item, mode, cart)) {
            toast.error(
                mode === "sheet"
                    ? `No more sheets available for ${item.name}`
                    : `No more packs available for ${item.name}`
            );
            return;
        }
        setCart((prev) => {
            const existing = prev.find((x) => x.id === item.id && x.mode === mode);
            if (existing) {
                return prev.map((x) =>
                    x.id === item.id && x.mode === mode ? { ...x, qty: x.qty + 1 } : x
                );
            }
            const unitPrice =
                mode === "sheet"
                    ? Number(item.sheet_selling_price || 0)
                    : Number(item.selling_price);
            return [
                ...prev,
                { id: item.id, name: item.name, unit_price: unitPrice, qty: 1, mode },
            ];
        });
    };

    const inc = (id, mode) => {
        const item = items.find((x) => x.id === id);
        if (!canAddOne(item, mode, cart)) {
            toast.error(`No more ${mode === "sheet" ? "sheets" : "packs"} available`);
            return;
        }
        setCart((prev) =>
            prev.map((x) =>
                x.id === id && x.mode === mode ? { ...x, qty: x.qty + 1 } : x
            )
        );
    };

    const dec = (id, mode) => {
        setCart((prev) =>
            prev.flatMap((x) => {
                if (!(x.id === id && x.mode === mode)) return [x];
                if (x.qty - 1 <= 0) return [];
                return [{ ...x, qty: x.qty - 1 }];
            })
        );
    };

    const remove = (id, mode) =>
        setCart((prev) => prev.filter((x) => !(x.id === id && x.mode === mode)));

    const submitBarcode = async (code) => {
        const c = (code || "").trim();
        if (!c) return;
        try {
            const res = await api.get(`/items/by-barcode/${encodeURIComponent(c)}`);
            const item = res.data;
            const hasSheets =
                item.sheets_per_pack > 0 && item.sheet_selling_price > 0;
            if (hasSheets) {
                setPendingItem(item);
            } else {
                addToCart(item, "pack");
                toast.success(`Added ${item.name}`);
            }
        } catch (e) {
            toast.error("No item with that barcode");
        } finally {
            setBarcodeInput("");
            barcodeRef.current?.focus();
        }
    };

    const onBarcodeChange = (val) => {
        setBarcodeInput(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const trimmed = val.trim();
        if (trimmed.length >= AUTO_SUBMIT_MIN_LEN) {
            debounceRef.current = setTimeout(() => {
                submitBarcode(trimmed);
            }, AUTO_SUBMIT_MS);
        }
    };

    const onBarcodeSubmit = (e) => {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        submitBarcode(barcodeInput);
    };

    const subtotal = cart.reduce((s, x) => s + x.unit_price * x.qty, 0);
    const discountNum = Number(discount) || 0;
    const total = subtotal - discountNum;

    const checkout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            const payload = {
                items: cart.map((c) => ({ item_id: c.id, qty: c.qty, mode: c.mode })),
                discount: discountNum,
            };
            const res = await api.post("/sales/checkout", payload);
            setSummary(res.data);
            setCart([]);
            setDiscount("");
            await loadItems();
            toast.success("Sale completed");
        } catch (e) {
            toast.error(e.response?.data?.detail || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            {/* LEFT */}
            <section className="space-y-5">
                <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <h1 className="font-display text-2xl font-bold text-stone-900 mb-1">
                        Point of Sale
                    </h1>
                    <p className="text-sm text-stone-500 mb-5">
                        Scan a barcode (USB reader or manual entry) — pack-only items
                        are added instantly. Sheet-tracked items ask whether to add a pack
                        or a sheet.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-stone-600 mb-1.5 block uppercase tracking-wide">
                                Barcode
                            </label>
                            <form onSubmit={onBarcodeSubmit}>
                                <div className="relative">
                                    <Barcode className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        ref={barcodeRef}
                                        data-testid="cashier-barcode-input"
                                        value={barcodeInput}
                                        onChange={(e) => onBarcodeChange(e.target.value)}
                                        placeholder="Scan or type a barcode (auto-adds)"
                                        autoFocus
                                        className="h-12 pl-10 rounded-xl"
                                    />
                                </div>
                            </form>
                            <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                                <div className="text-xs text-emerald-800">
                                    <span className="font-bold">Tip:</span> USB scanners
                                    auto-add. Manual typing adds after a short pause, or
                                    press Enter immediately.
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-stone-600 mb-1.5 block uppercase tracking-wide">
                                Search
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    data-testid="cashier-search-input"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name, type, barcode…"
                                    className="h-12 pl-10 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-display text-lg font-bold text-stone-900">
                            Items ({filtered.length})
                        </h2>
                    </div>
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
                        data-testid="cashier-items-grid"
                    >
                        {filtered.map((it) => (
                            <ItemCard
                                key={it.id}
                                item={it}
                                cart={cart}
                                onAddPack={() => addToCart(it, "pack")}
                                onAddSheet={() => addToCart(it, "sheet")}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="col-span-full text-center py-12 text-stone-400">
                                No items match your search.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* RIGHT: Cart */}
            <aside className="bg-white rounded-2xl border border-stone-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-stone-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-emerald-600" />
                        Current Bill
                    </h2>
                    <Badge variant="secondary" className="rounded-full bg-stone-100 text-stone-700">
                        {cart.length} {cart.length === 1 ? "line" : "lines"}
                    </Badge>
                </div>

                {cart.length === 0 ? (
                    <div className="cart-empty-illustration flex-1 rounded-xl flex flex-col items-center justify-center py-12 px-4 text-center min-h-[260px]">
                        <ShoppingBag className="w-10 h-10 text-emerald-400 mb-3" strokeWidth={1.5} />
                        <div className="font-semibold text-stone-700">Bill is empty</div>
                        <div className="text-sm text-stone-500 mt-1">
                            Scan or click items to add.
                        </div>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 -mx-2 px-2 max-h-[420px]">
                        <ul className="divide-y divide-stone-100" data-testid="cart-list">
                            {cart.map((c) => (
                                <li
                                    key={lineKey(c.id, c.mode)}
                                    data-testid={`cart-item-${c.id}-${c.mode}`}
                                    className="py-3 flex items-start gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-stone-900 text-sm leading-tight truncate">
                                                {c.name}
                                            </div>
                                            <Badge
                                                className={`rounded-full text-[10px] px-2 py-0 ${
                                                    c.mode === "sheet"
                                                        ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
                                                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                                }`}
                                            >
                                                {c.mode}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-stone-500 mt-0.5">
                                            {formatIQD(c.unit_price)} each
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                type="button"
                                                data-testid={`cart-dec-${c.id}-${c.mode}`}
                                                onClick={() => dec(c.id, c.mode)}
                                                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 flex items-center justify-center btn-soft"
                                                aria-label="Decrease"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span
                                                data-testid={`cart-qty-${c.id}-${c.mode}`}
                                                className="font-display font-bold text-stone-900 w-7 text-center"
                                            >
                                                {c.qty}
                                            </span>
                                            <button
                                                type="button"
                                                data-testid={`cart-inc-${c.id}-${c.mode}`}
                                                onClick={() => inc(c.id, c.mode)}
                                                className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-500 hover:text-white text-emerald-700 flex items-center justify-center btn-soft"
                                                aria-label="Increase"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                data-testid={`cart-remove-${c.id}-${c.mode}`}
                                                onClick={() => remove(c.id, c.mode)}
                                                className="ml-auto text-stone-400 hover:text-rose-600 btn-soft"
                                                aria-label="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        className="text-right font-display font-bold text-stone-900 whitespace-nowrap"
                                        data-testid={`cart-subtotal-${c.id}-${c.mode}`}
                                    >
                                        {formatIQD(c.unit_price * c.qty)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                )}

                <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">Subtotal</span>
                        <span data-testid="cart-subtotal" className="font-semibold text-stone-700">
                            {formatIQD(subtotal)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <label className="text-sm text-stone-500 whitespace-nowrap" htmlFor="discount">
                            Discount (IQD)
                        </label>
                        <Input
                            id="discount"
                            type="number"
                            inputMode="numeric"
                            step="any"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            data-testid="discount-input"
                            placeholder="0"
                            className="h-10 rounded-xl text-right w-32 font-semibold"
                        />
                    </div>
                    {discountNum !== 0 && (
                        <div className="text-[11px] text-stone-400 text-right -mt-1">
                            {discountNum > 0
                                ? `−${formatIQD(discountNum)} discount`
                                : `+${formatIQD(-discountNum)} surcharge`}
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <span className="text-sm text-stone-500">Total</span>
                        <span
                            data-testid="cart-total"
                            className={`font-display text-3xl font-bold tracking-tight ${
                                total < 0 ? "text-rose-600" : "text-emerald-700"
                            }`}
                        >
                            {formatIQD(total)}
                        </span>
                    </div>
                    <Button
                        data-testid="checkout-button"
                        disabled={cart.length === 0 || loading}
                        onClick={checkout}
                        className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
                    >
                        {loading ? "Processing…" : "Complete Sale"}
                    </Button>
                </div>
            </aside>

            {/* Pack vs Sheet prompt after scanning a sheet-tracked item */}
            <Dialog open={!!pendingItem} onOpenChange={(o) => !o && setPendingItem(null)}>
                <DialogContent data-testid="pack-or-sheet-dialog" className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display">Pack or Sheet?</DialogTitle>
                        <DialogDescription>
                            <span className="font-semibold text-stone-800">
                                {pendingItem?.name}
                            </span>{" "}
                            is sold in packs of {pendingItem?.sheets_per_pack} sheets.
                            How do you want to add it?
                        </DialogDescription>
                    </DialogHeader>
                    {pendingItem && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <button
                                type="button"
                                data-testid="prompt-add-pack"
                                onClick={() => {
                                    addToCart(pendingItem, "pack");
                                    setPendingItem(null);
                                    setTimeout(() => barcodeRef.current?.focus(), 50);
                                }}
                                className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white btn-soft"
                            >
                                <Package className="w-6 h-6" />
                                <div className="font-display font-bold">Pack</div>
                                <div className="text-sm opacity-90">
                                    {formatIQD(pendingItem.selling_price)}
                                </div>
                            </button>
                            <button
                                type="button"
                                data-testid="prompt-add-sheet"
                                onClick={() => {
                                    addToCart(pendingItem, "sheet");
                                    setPendingItem(null);
                                    setTimeout(() => barcodeRef.current?.focus(), 50);
                                }}
                                className="flex flex-col items-center justify-center gap-1 h-24 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white btn-soft"
                            >
                                <Layers className="w-6 h-6" />
                                <div className="font-display font-bold">Sheet</div>
                                <div className="text-sm opacity-90">
                                    {formatIQD(pendingItem.sheet_selling_price)}
                                </div>
                            </button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Sale summary */}
            <Dialog open={!!summary} onOpenChange={(o) => !o && setSummary(null)}>
                <DialogContent data-testid="sale-summary-dialog" className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-display flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="w-5 h-5" />
                            Sale Completed
                        </DialogTitle>
                    </DialogHeader>
                    {summary && (
                        <div className="space-y-3">
                            <div className="text-xs text-stone-500">
                                Receipt #{summary.id.slice(0, 8).toUpperCase()}
                            </div>
                            <ul className="divide-y divide-stone-100 max-h-64 overflow-auto">
                                {summary.lines.map((l, i) => (
                                    <li key={i} className="py-2 flex justify-between text-sm">
                                        <span className="text-stone-700">
                                            {l.name} × {l.qty}{" "}
                                            <span className="text-xs text-stone-400">
                                                ({l.mode || "pack"})
                                            </span>
                                        </span>
                                        <span className="font-semibold">
                                            {formatIQD(l.subtotal)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <div className="pt-3 border-t border-stone-100 space-y-1 text-sm">
                                <div className="flex justify-between text-stone-500">
                                    <span>Subtotal</span>
                                    <span>{formatIQD(summary.subtotal || 0)}</span>
                                </div>
                                {(summary.discount || 0) !== 0 && (
                                    <div className="flex justify-between text-stone-500">
                                        <span>
                                            {summary.discount > 0 ? "Discount" : "Surcharge"}
                                        </span>
                                        <span>
                                            {summary.discount > 0 ? "−" : "+"}
                                            {formatIQD(Math.abs(summary.discount || 0))}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                                    <span className="text-stone-500">Total Paid</span>
                                    <span className="font-display font-bold text-2xl text-emerald-700">
                                        {formatIQD(summary.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            data-testid="summary-close"
                            onClick={() => {
                                setSummary(null);
                                setTimeout(() => barcodeRef.current?.focus(), 50);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                        >
                            New Sale
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const ItemCard = ({ item, cart, onAddPack, onAddSheet }) => {
    const stock = stockSummary(item);
    const hasSheets =
        item.sheets_per_pack && item.sheets_per_pack > 0 && item.sheet_selling_price > 0;
    const canPack = canAddOne(item, "pack", cart);
    const canSheet = hasSheets && canAddOne(item, "sheet", cart);
    const isOut = stock.level === "out";

    const stockPill =
        stock.level === "out"
            ? "bg-rose-100 text-rose-700"
            : stock.level === "low"
            ? "bg-amber-100 text-amber-800 low-stock"
            : "bg-emerald-100 text-emerald-700";

    return (
        <div
            data-testid={`cashier-item-${item.id}`}
            className={`p-4 rounded-xl border bg-white ${
                isOut ? "border-stone-100 opacity-60" : "border-stone-100 hover:border-emerald-300"
            } transition`}
        >
            <div className="text-xs text-emerald-700 font-semibold mb-1">{item.type}</div>
            <div className="font-semibold text-stone-900 leading-tight line-clamp-2 min-h-[2.5rem]">
                {item.name}
            </div>
            <div className="flex items-center justify-between mt-3">
                <div>
                    <div className="font-display font-bold text-emerald-700 text-sm">
                        {formatIQD(item.selling_price)}
                        <span className="text-stone-400 font-normal ml-1">/ pack</span>
                    </div>
                    {hasSheets && (
                        <div className="font-display font-bold text-indigo-700 text-sm mt-0.5">
                            {formatIQD(item.sheet_selling_price)}
                            <span className="text-stone-400 font-normal ml-1">/ sheet</span>
                        </div>
                    )}
                </div>
                <Badge className={`rounded-full text-[10px] ${stockPill} hover:${stockPill}`}>
                    {stock.label}
                </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                    type="button"
                    onClick={onAddPack}
                    disabled={!canPack}
                    data-testid={`add-pack-${item.id}`}
                    className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold btn-soft disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed"
                >
                    <Package className="w-4 h-4" />
                    Pack
                </button>
                {hasSheets ? (
                    <button
                        type="button"
                        onClick={onAddSheet}
                        disabled={!canSheet}
                        data-testid={`add-sheet-${item.id}`}
                        className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold btn-soft disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed"
                    >
                        <Layers className="w-4 h-4" />
                        Sheet
                    </button>
                ) : (
                    <div className="h-9 rounded-lg bg-stone-50 text-stone-400 text-xs flex items-center justify-center">
                        No sheets
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashierPage;
