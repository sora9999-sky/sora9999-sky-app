import "@/App.css";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import CashierPage from "@/pages/CashierPage";
import StoragePage from "@/pages/StoragePage";
import { IS_DESKTOP } from "@/lib/api";

// Use HashRouter inside Electron (file:// can't do clean URLs); BrowserRouter on the web.
const Router = IS_DESKTOP ? HashRouter : BrowserRouter;

function App() {
    return (
        <div className="App app-grain">
            <Router>
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Navigate to="/cashier" replace />} />
                        <Route path="/cashier" element={<CashierPage />} />
                        <Route path="/storage" element={<StoragePage />} />
                    </Route>
                </Routes>
            </Router>
            <Toaster position="top-right" richColors />
        </div>
    );
}

export default App;
