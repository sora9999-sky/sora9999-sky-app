import "@/App.css";
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import CashierPage from "@/pages/CashierPage";
import StoragePage from "@/pages/StoragePage";
import NotificationsPage from "@/pages/NotificationsPage";
import SalesHistoryPage from "@/pages/SalesHistoryPage";
import SuppliersPage from "@/pages/SuppliersPage";
import { IS_DESKTOP } from "@/lib/api";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const Router = IS_DESKTOP ? HashRouter : BrowserRouter;

const Protected = ({ children }) => {
    const { unlocked } = useAuth();
    if (!unlocked) return <Navigate to="/cashier" replace />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <div className="App app-grain">
                <Router>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/cashier" replace />} />
                            <Route path="/cashier" element={<CashierPage />} />
                            <Route
                                path="/storage"
                                element={
                                    <Protected>
                                        <StoragePage />
                                    </Protected>
                                }
                            />
                            <Route
                                path="/notifications"
                                element={
                                    <Protected>
                                        <NotificationsPage />
                                    </Protected>
                                }
                            />
                            <Route
                                path="/sales"
                                element={
                                    <Protected>
                                        <SalesHistoryPage />
                                    </Protected>
                                }
                            />
                            <Route
                                path="/suppliers"
                                element={
                                    <Protected>
                                        <SuppliersPage />
                                    </Protected>
                                }
                            />
                            <Route path="*" element={<Navigate to="/cashier" replace />} />
                        </Route>
                    </Routes>
                </Router>
                <Toaster position="top-right" richColors />
            </div>
        </AuthProvider>
    );
}

export default App;
