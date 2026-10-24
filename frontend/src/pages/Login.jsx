import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiArrowRight,
    FiEye,
    FiEyeOff,
    FiLock,
    FiShield,
    FiUser,
} from "react-icons/fi";
import { LuSprout } from "react-icons/lu";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

export default function Login() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to sign in.");
            }

            if (!data.admin) {
                throw new Error("Invalid login response from server.");
            }

            // The JWT is stored in an HttpOnly cookie by the backend.
            // Do not save the JWT in localStorage.
            setPassword("");
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.message === "Failed to fetch"
                    ? "Unable to connect to the server. Please check your connection and try again."
                    : err.message
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-page text-heading lg:grid lg:grid-cols-2">
            {/* Brand panel */}
            <section className="relative hidden min-h-screen flex-col overflow-hidden bg-brand-dark px-7 py-8 text-on-dark lg:flex lg:px-14 xl:px-20">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10 sm:h-96 sm:w-96"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 top-36 h-56 w-56 rounded-full border border-white/10 sm:h-72 sm:w-72"
                />

                <Link
                    to="/"
                    aria-label="Aaangan home"
                    className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl rounded-bl-sm border border-white/10 bg-brand-dark text-brand-light transition hover:bg-brand-hover"
                >
                    <LuSprout size={25} strokeWidth={1.7} />
                </Link>

                <div className="relative z-10 my-auto max-w-xl py-12 lg:py-20">
                    <div className="mb-6 flex items-center gap-3">
                        <span className="h-px w-8 bg-brand-light" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-light sm:text-xs">
                            Aaangan · Administrator access
                        </p>
                    </div>

                    <h1 className="max-w-xl font-serif text-[42px] font-medium leading-[1.13] tracking-tight sm:text-5xl md:text-6xl xl:text-[68px]">
                        A little more clarity
                        <br className="hidden sm:block" /> for the work that matters.
                    </h1>

                    <p className="mt-6 max-w-md text-sm leading-7 text-on-dark-muted sm:text-base sm:leading-8">
                        A thoughtful workspace for managing children&apos;s records,
                        contributions, expenses and the everyday essentials of care.
                    </p>

                    <div className="mt-8 flex items-center gap-3 text-sm text-on-dark">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-brand-light">
                            <FiShield size={18} />
                        </span>
                        <span>One secure workspace. A world of care.</span>
                    </div>
                </div>

                <div className="relative z-10 hidden border-t border-white/10 pt-5 text-xs leading-6 text-on-dark-muted lg:block">
                    Care begins with the little things.
                    <span className="float-right">Aaangan © 2026</span>
                </div>
            </section>

            {/* Login panel */}
            <section className="flex min-h-145 items-center justify-center px-6 py-12 sm:px-10 lg:min-h-screen lg:px-12 xl:px-16">
                <div className="w-full max-w-102.5">
                    <Link
                        to="/"
                        className="mb-10 inline-flex items-center gap-2 text-sm text-body transition hover:text-brand sm:mb-14"
                    >
                        <FiArrowLeft size={17} />
                        Back to home
                    </Link>

                    <div className="mb-8">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.19em] text-brand">
                            Your workspace awaits
                        </p>

                        <h2 className="font-serif text-4xl font-medium tracking-tight text-heading sm:text-[46px]">
                            Welcome back.
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-body sm:text-[15px]">
                            Sign in to continue to your Aaangan admin workspace.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="username"
                                className="mb-2 block text-sm font-medium text-heading"
                            >
                                Admin username
                            </label>

                            <div className="group flex h-13 items-center gap-3 rounded-lg border border-border bg-surface/70 px-4 transition focus-within:border-brand focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand/10">
                                <FiUser
                                    className="shrink-0 text-body group-focus-within:text-brand"
                                    size={18}
                                />

                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted disabled:opacity-60"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-heading"
                            >
                                Password
                            </label>

                            <div className="group flex h-13 items-center gap-3 rounded-lg border border-border bg-surface/70 px-4 transition focus-within:border-brand focus-within:bg-surface focus-within:ring-4 focus-within:ring-brand/10">
                                <FiLock
                                    className="shrink-0 text-body group-focus-within:text-brand"
                                    size={18}
                                />

                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    disabled={loading}
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-heading outline-none placeholder:text-muted disabled:opacity-60"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-body transition hover:bg-brand-soft hover:text-brand"
                                >
                                    {showPassword ? (
                                        <FiEyeOff size={18} />
                                    ) : (
                                        <FiEye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-sm leading-5 text-danger"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="group flex h-13 w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? "Signing you in..." : "Sign in to Aaangan"}

                            {!loading && (
                                <FiArrowRight
                                    size={17}
                                    className="transition-transform group-hover:translate-x-1"
                                />
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-start justify-center gap-2 text-center text-xs leading-5 text-body">
                        <FiShield size={15} className="mt-0.5 shrink-0 text-brand" />
                        <p>Secure access for authorized administrators only.</p>
                    </div>

                    <div className="mt-10 border-t border-border pt-5 text-center text-xs text-muted">
                        Aaangan · A place for care, a future full of possibilities.
                    </div>
                </div>
            </section>
        </main>
    );
}
