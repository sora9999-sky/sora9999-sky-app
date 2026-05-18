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
