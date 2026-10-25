import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    FiGrid,
    FiUsers,
    FiHeart,
    FiDollarSign,
    FiBarChart2,
    FiLogOut,
    FiMenu,
    FiX,
} from "react-icons/fi";
import { LuSprout } from "react-icons/lu";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const navigation = [
    { label: "Overview", path: "/dashboard", icon: FiGrid },
    { label: "Children", path: "/children", icon: FiUsers },
    { label: "Donations", path: "/donations", icon: FiHeart },
    { label: "Expenses", path: "/expenses", icon: FiDollarSign },
    { label: "Reports", path: "/reports", icon: FiBarChart2 },
];

export default function Sidebar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleLogout() {
        setLoggingOut(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                throw new Error("Unable to sign out. Please try again.");
            }

            setMenuOpen(false);
            navigate("/login", { replace: true });
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoggingOut(false);
        }
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <>
            {/* Mobile header: hidden on desktop */}
            <header className="fixed inset-x-0 top-0 z-30 flex h-17 items-center justify-between border-b border-[#2c3b30] bg-[#19271d] px-5 text-[#f3f1e8] md:hidden">
                <NavLink
                    to="/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#203126] text-[#b7c28d]">
                        <LuSprout size={25} />
                    </span>

                    <span className="text-sm font-semibold tracking-[0.12em]">
                        Aangan <span className="font-normal text-[#b7bdb3]">HOUSE</span>
                    </span>
                </NavLink>

                <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                    aria-expanded={menuOpen}
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-[#f3f1e8] transition hover:bg-white/10">
                    {menuOpen ? <FiX size={23} /> : <FiMenu size={23} />}
                </button>
            </header>

            {/* Mobile backdrop */}
            {menuOpen && (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={closeMenu}
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"/>
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-71.25 max-w-[85vw] flex-col bg-[#19271d] px-6.25 py-6 text-[#c1c7bd] transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-20 md:h-screen md:w-71.25 md:max-w-none md:translate-x-0 md:shrink-0 md:transition-none ${menuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}>
                {/* Brand: visible in sidebar on desktop */}
                <NavLink
                    to="/dashboard"
                    onClick={closeMenu}
                    className="mb-8 hidden h-13 items-center gap-4 md:flex">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#203126] text-[#b7c28d]">
                        <LuSprout size={27} />
                    </span>

                    <span className="whitespace-nowrap text-[17px] font-semibold tracking-[0.09em] text-[#f3f1e8]">
                        AANGAN
                    </span>
                </NavLink>

                {/* Mobile spacing below the header */}
                <div className="mb-6 h-11 shrink-0 md:hidden" />

                <nav aria-label="Main navigation" className="flex-1 space-y-1.5">
                    {navigation.map(({ label, path, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === "/dashboard"}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex min-h-12.5 items-center gap-4 rounded-md px-4 text-[16px] transition-colors ${isActive
                                    ? "bg-[#29372c] text-[#f5f3eb]"
                                    : "text-[#b9c0b7] hover:bg-[#223026] hover:text-[#f5f3eb]"
                                }`
                            }>
                            <Icon size={20} strokeWidth={1.8} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="mt-8 border-t border-[#344136] pt-5">
                    <p className="mb-1 text-sm text-[#aeb6ab]">
                        Signed in as
                    </p>
                    <p className="text-sm font-semibold text-[#f3f1e8]">
                        Administrator
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#aeb6ab]">
                        Managing records and care.
                    </p>

                    {error && (
                        <p role="alert" className="mt-3 text-sm text-red-300">
                            {error}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="mt-5 flex min-h-11 w-full items-center gap-3 rounded-md border border-[#344136] px-4 text-sm text-[#f3f1e8] transition hover:bg-[#26352a] disabled:cursor-not-allowed disabled:opacity-60">
                        <FiLogOut size={19} />
                        {loggingOut ? "Signing out..." : "Sign out"}
                    </button>
                </div>
            </aside>
        </>
    );
}
