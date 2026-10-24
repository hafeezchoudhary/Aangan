
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function ProtectedRoute() {
    const [status, setStatus] = useState("checking");

    useEffect(() => {
        const controller = new AbortController();

        async function checkSession() {
            try {
                const response = await fetch(`${API_URL}/api/auth/protected`, {
                    method: "GET",
                    credentials: "include",
                    signal: controller.signal,
                });

                setStatus(response.ok ? "authenticated" : "unauthenticated");
            } catch (error) {
                if (error.name !== "AbortError") {
                    setStatus("unauthenticated");
                }
            }
        }

        checkSession();

        return () => controller.abort();
    }, []);

    if (status === "checking") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-page text-body">
                Checking your session...
            </div>
        );
    }

    if (status === "unauthenticated") {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
