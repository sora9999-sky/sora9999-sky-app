import { useEffect, useRef, useState } from "react";
import { Lock } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { APP_PASSWORD } from "@/contexts/AuthContext";

const PasswordDialog = ({ open, onClose, onSuccess }) => {
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setPw("");
            setErr("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    const submit = (e) => {
        e.preventDefault();
        if (pw === APP_PASSWORD) {
            onSuccess();
        } else {
            setErr("Wrong password");
            setPw("");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose?.()}>
            <DialogContent data-testid="password-dialog" className="rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2 text-stone-900">
                        <Lock className="w-5 h-5 text-rose-500" />
                        Unlock protected screens
                    </DialogTitle>
                    <DialogDescription>
                        Enter the password to access Storage, Notifications, Sales History
                        and Suppliers. Stays unlocked until you close the app.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-3">
                    <Input
                        ref={inputRef}
                        data-testid="password-input"
                        type="password"
                        value={pw}
                        onChange={(e) => {
                            setPw(e.target.value);
                            setErr("");
                        }}
                        placeholder="Password"
                        className="h-12 rounded-xl"
                        autoFocus
                    />
                    {err && (
                        <p
                            data-testid="password-error"
                            className="text-sm text-rose-600 font-semibold"
                        >
                            {err}
                        </p>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            data-testid="password-cancel"
                            onClick={() => onClose?.()}
                            className="rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            data-testid="password-submit"
                            className="bg-rose-500 hover:bg-rose-600 rounded-xl"
                        >
                            Unlock
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PasswordDialog;
