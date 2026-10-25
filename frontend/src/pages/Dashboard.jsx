
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    FiUsers,
    FiHeart,
    FiDollarSign,
    FiBarChart2,
    FiArrowUpRight,
    FiAlertCircle,
    FiRefreshCw,
} from "react-icons/fi";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
}

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function ActivityPanel({ title, children }) {
    return (
        <section className="min-w-0 overflow-hidden rounded-md border border-[#dfddd3] bg-[#fffefd]">
            <div className="flex min-h-16 items-center justify-between border-b border-[#dfddd3] px-5 sm:px-6">
                <h2 className="text-base font-medium text-[#19251c]">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function EmptyActivity({ message }) {
    return (
        <div className="flex min-h-28 items-center justify-center px-5 py-6 text-center">
            <p className="max-w-xs text-sm leading-6 text-[#777c71]">
                {message}
            </p>
        </div>
    );
}

function ActivityLoading() {
    return (
        <div className="space-y-4 px-5 py-6 sm:px-6">
            {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse">
                    <div className="h-3 w-2/5 rounded bg-[#e9e7de]" />
                    <div className="mt-2 h-3 w-3/5 rounded bg-[#f0eee6]" />
                </div>
            ))}
        </div>
    );
}

function RecentDonation({ donation }) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e0eadb] text-[#35563a]">
                    <FiHeart size={18} />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#19251c]">
                        {donation.donorName || "Unnamed donor"}
                    </p>
                    <p className="mt-1 text-xs text-[#777c71]">
                        {donation.donationId || "Donation"} · {formatDate(donation.date)}
                    </p>
                </div>
            </div>

            <p className="shrink-0 text-sm font-semibold text-[#35563a]">
                +{formatCurrency(donation.amount)}
            </p>
        </div>
    );
}

function RecentExpense({ expense }) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0eee4] text-[#53604f]">
                    <FiDollarSign size={18} />
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#19251c]">
                        {expense.title || "Untitled expense"}
                    </p>
                    <p className="mt-1 text-xs text-[#777c71]">
                        {expense.category || "Other"} · {formatDate(expense.date)}
                    </p>
                </div>
            </div>

            <p className="shrink-0 text-sm font-semibold text-[#19251c]">
                −{formatCurrency(expense.amount)}
            </p>
        </div>
    );
}

export default function Dashboard() {
    const [dashboard, setDashboard] = useState({
        activeChildren: 0,
        totalDonations: 0,
        totalExpenses: 0,
        balance: 0,
        donations: [],
        expenses: [],
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const requestOptions = {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            };

            const [childrenResponse, donationsResponse, expensesResponse] =
                await Promise.all([
                    fetch(`${API_URL}/api/children`, requestOptions),
                    fetch(`${API_URL}/api/donations`, requestOptions),
                    fetch(`${API_URL}/api/expenses`, requestOptions),
                ]);

            const responses = [
                childrenResponse,
                donationsResponse,
                expensesResponse,
            ];

            const responseData = await Promise.all(
                responses.map(async (response) => {
                    const data = await response.json().catch(() => ({}));

                    if (!response.ok) {
                        throw new Error(
                            data.message || "Unable to load dashboard information."
                        );
                    }

                    return data;
                })
            );

            const [childrenData, donationsData, expensesData] = responseData;

            const children = Array.isArray(childrenData.children)
                ? childrenData.children
                : [];

            const donations = Array.isArray(donationsData.donations)
                ? donationsData.donations
                : [];

            const expenses = Array.isArray(expensesData.expenses)
                ? expensesData.expenses
                : [];

            const activeChildren = children.filter(
                (child) => child.status === "Active"
            ).length;

            const totalDonations = Number(donationsData.totalAmount) || 0;
            const totalExpenses = Number(expensesData.totalAmount) || 0;

            const sortNewestFirst = (records) =>
                [...records].sort((a, b) => {
                    const dateA = new Date(a.date || a.createdAt || 0).getTime();
                    const dateB = new Date(b.date || b.createdAt || 0).getTime();

                    return dateB - dateA;
                });

            setDashboard({
                activeChildren,
                totalDonations,
                totalExpenses,
                balance: totalDonations - totalExpenses,
                donations: sortNewestFirst(donations).slice(0, 5),
                expenses: sortNewestFirst(expenses).slice(0, 5),
            });
        } catch (err) {
            setError(
                err.message ||
                "Could not connect to the Aaangan backend. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const summaryCards = [
        {
            title: "Children in care",
            value: loading ? "—" : dashboard.activeChildren.toLocaleString("en-IN"),
            subtitle: "Currently active children",
            icon: FiUsers,
            path: "/children",
        },
        {
            title: "Donations received",
            value: loading ? "—" : formatCurrency(dashboard.totalDonations),
            subtitle: "Total contributions",
            icon: FiHeart,
            path: "/donations",
        },
        {
            title: "Expenses recorded",
            value: loading ? "—" : formatCurrency(dashboard.totalExpenses),
            subtitle: "Total expenditure",
            icon: FiDollarSign,
            path: "/expenses",
        },
        {
            title: "Current balance",
            value: loading ? "—" : formatCurrency(dashboard.balance),
            subtitle: "Donations minus expenses",
            icon: FiBarChart2,
            path: "/reports",
        },
    ];

    return (
        <main className="min-h-screen min-w-0 bg-[#f8f6f0] px-5 pb-10 pt-23 sm:px-8 md:px-10 md:py-8 lg:px-12 xl:px-14">
            <div className="mx-auto max-w-7xl">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#39553c]">
                            Workspace
                        </p>

                        <h1 className="mt-1 font-serif text-3xl font-medium leading-tight tracking-tight text-[#19251c] sm:text-4xl lg:text-[42px]">
                            Hello, Administrator.
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#596257] sm:text-base">
                            Here&apos;s the current picture of the home — children in care,
                            community support and everyday spending.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchDashboard}
                        disabled={loading}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-md border border-[#dfddd3] bg-[#fffefd] px-4 py-2 text-sm font-medium text-[#35563a] transition hover:bg-[#f0eee6] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto">
                        <FiRefreshCw size={15} className={loading ? "animate-spin" : ""}/>
                        Refresh
                    </button>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mt-6 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-2">
                            <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                            <p>{error}</p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchDashboard}
                            className="self-start font-semibold underline">
                            Try again
                        </button>
                    </div>
                )}

                <section
                    aria-label="Summary"
                    className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map(
                        ({ title, value, subtitle, icon: Icon, path }) => (
                            <Link
                                key={title}
                                to={path}
                                aria-label={`Open ${title}`}
                                className="group relative block min-w-0 rounded-md border border-[#dfddd3] bg-[#fffefd] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#b9c9b3] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#456748] sm:p-6">
                                <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#35563a] opacity-0 transition-all duration-200 group-hover:bg-[#e0eadb] group-hover:opacity-100 group-focus-visible:opacity-100">
                                    <FiArrowUpRight size={20} />
                                </span>

                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e0eadb] text-[#35563a]">
                                    <Icon size={21} strokeWidth={1.8} />
                                </div>

                                <p className="mt-4 wrap-break-word font-serif text-2xl font-medium text-[#19251c] sm:text-[30px]">
                                    {value}
                                </p>

                                <h2 className="mt-2 text-sm font-semibold text-[#19251c]">
                                    {title}
                                </h2>

                                <p className="mt-0.5 text-sm text-[#697165]">{subtitle}</p>
                            </Link>
                        )
                    )}
                </section>

                <section className="mt-6 grid grid-cols-1 items-start gap-5 xl:grid-cols-2 xl:gap-7">
                    <ActivityPanel title="Recent donations">
                        {loading ? (
                            <ActivityLoading />
                        ) : dashboard.donations.length === 0 ? (
                            <EmptyActivity message="No donations recorded yet. Your latest contributions will appear here." />
                        ) : (
                            <div className="divide-y divide-[#e9e6dd]">
                                {dashboard.donations.map((donation, index) => (
                                    <RecentDonation
                                        key={donation._id || donation.donationId || index}
                                        donation={donation}/>
                                ))}
                                <div className="px-5 py-3 sm:px-6">
                                    <Link to="/donations" className="text-sm font-semibold text-[#35563a] hover:underline">
                                        View all donations →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </ActivityPanel>

                    <ActivityPanel title="Recent expenses">
                        {loading ? (
                            <ActivityLoading />
                        ) : dashboard.expenses.length === 0 ? (
                            <EmptyActivity message="No expenses recorded yet. Your latest spending entries will appear here." />
                        ) : (
                            <div className="divide-y divide-[#e9e6dd]">
                                {dashboard.expenses.map((expense, index) => (
                                    <RecentExpense
                                        key={expense._id || expense.expenseId || index}
                                        expense={expense}/>
                                ))}
                                <div className="px-5 py-3 sm:px-6">
                                    <Link
                                        to="/expenses"
                                        className="text-sm font-semibold text-[#35563a] hover:underline">
                                        View all expenses →
                                    </Link>
                                </div>
                            </div>
                        )}
                    </ActivityPanel>
                </section>
            </div>
        </main>
    );
}
