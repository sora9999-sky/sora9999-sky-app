import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const isElectron = typeof window !== "undefined" && !!window.pharmacyAPI;

// ---- Web (HTTP via axios) ----
const httpClient = axios.create({ baseURL: API });

// ---- Offline desktop (Electron IPC) ----
const electronError = (e) => {
    const err = new Error(e?.message || "Request failed");
    err.response = { data: { detail: e?.message || "Request failed" } };
    return err;
};

const electronRoute = async (method, url, body) => {
    const api = window.pharmacyAPI;
    try {
        if (method === "GET" && url === "/items") {
            return { data: await api.listItems() };
        }
        if (method === "GET" && url.startsWith("/items/by-barcode/")) {
            const code = decodeURIComponent(url.split("/").pop());
            return { data: await api.getItemByBarcode(code) };
        }
        if (method === "GET" && url.startsWith("/items/")) {
            const id = url.split("/").pop();
            return { data: await api.getItem(id) };
        }
        if (method === "POST" && url === "/items") {
            return { data: await api.createItem(body) };
        }
        if (method === "PUT" && url.startsWith("/items/")) {
            const id = url.split("/").pop();
            return { data: await api.updateItem(id, body) };
        }
        if (method === "DELETE" && url.startsWith("/items/")) {
            const id = url.split("/").pop();
            return { data: await api.deleteItem(id) };
        }
        if (method === "POST" && url === "/sales/checkout") {
            return { data: await api.checkout(body) };
        }
        if (method === "GET" && url === "/sales") {
            return { data: await api.listSales() };
        }
        if (method === "DELETE" && url === "/sales") {
            return { data: await api.clearAllSales() };
        }
        if (method === "GET" && url === "/notifications") {
            return { data: await api.listNotifications() };
        }
        if (method === "POST" && url === "/notifications/dismiss") {
            return { data: await api.dismissNotification(body.item_id, body.type) };
        }
        if (method === "POST" && url === "/notifications/clear-all") {
            return { data: await api.clearAllNotifications() };
        }
        throw new Error(`Unhandled route ${method} ${url}`);
    } catch (e) {
        throw electronError(e);
    }
};

export const api = isElectron
    ? {
          get: (url) => electronRoute("GET", url),
          post: (url, body) => electronRoute("POST", url, body),
          put: (url, body) => electronRoute("PUT", url, body),
          delete: (url) => electronRoute("DELETE", url),
      }
    : httpClient;

export const IS_DESKTOP = isElectron;

export const formatIQD = (amount) => {
    const n = Math.round(Number(amount) || 0);
    return `${n.toLocaleString("en-US")} IQD`;
};

// Visual summary of an item's stock, honouring pack + sheet breakdown.
export const stockSummary = (item) => {
    const sheetsPerPack = item.sheets_per_pack || 0;
    const packs = item.stock_qty || 0;
    const loose = item.loose_sheets || 0;
    if (sheetsPerPack > 0) {
        if (packs === 0 && loose === 0) return { label: "Out of stock", level: "out" };
        const parts = [];
        if (packs > 0) parts.push(`${packs} pack${packs !== 1 ? "s" : ""}`);
        if (loose > 0) parts.push(`${loose} sheet${loose !== 1 ? "s" : ""}`);
        const totalSheets = packs * sheetsPerPack + loose;
        const level =
            totalSheets <= sheetsPerPack ? "low" : packs <= 2 ? "low" : "ok";
        return { label: parts.join(" + "), level };
    }
    if (packs <= 0) return { label: "Out of stock", level: "out" };
    if (packs <= 10) return { label: `${packs} left`, level: "low" };
    return { label: `${packs} left`, level: "ok" };
};

// True if a single unit of `mode` can still be added given current cart.
export const canAddOne = (item, mode, cart) => {
    if (!item) return false;
    const packsInCart = cart
        .filter((c) => c.id === item.id && c.mode === "pack")
        .reduce((s, c) => s + c.qty, 0);
    const sheetsInCart = cart
        .filter((c) => c.id === item.id && c.mode === "sheet")
        .reduce((s, c) => s + c.qty, 0);
    const sheetsPerPack = item.sheets_per_pack || 0;
    const looseSheets = item.loose_sheets || 0;

    if (mode === "pack") {
        const proposedPacks = packsInCart + 1;
        if (proposedPacks > item.stock_qty) return false;
        if (sheetsPerPack > 0) {
            const remainingSheets =
                (item.stock_qty - proposedPacks) * sheetsPerPack + looseSheets;
            if (sheetsInCart > remainingSheets) return false;
        }
        return true;
    }
    // sheet
    if (!sheetsPerPack) return false;
    const remainingSheets =
        (item.stock_qty - packsInCart) * sheetsPerPack + looseSheets;
    return sheetsInCart + 1 <= remainingSheets;
};
