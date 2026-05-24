import { createContext, useContext, useState } from "react";

const AuthContext = createContext({
    unlocked: false,
    unlock: () => {},
});

export const APP_PASSWORD = "abody1999";

export const AuthProvider = ({ children }) => {
    const [unlocked, setUnlocked] = useState(false);
    return (
        <AuthContext.Provider value={{ unlocked, unlock: () => setUnlocked(true) }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
