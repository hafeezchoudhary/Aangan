
import { Link } from "react-router-dom";
import {
    FiUsers,
    FiHeart,
    FiDollarSign,
    FiBarChart2,
    FiArrowUpRight,
} from "react-icons/fi";

const summaryCards = [
    {
        title: "Children in care",
        value: "0",
        subtitle: "Registered children",
        icon: FiUsers,
        path: "/children",
    },
    {
        title: "Donations received",
        value: "₹0",
        subtitle: "Total contributions",
        icon: FiHeart,
        path: "/donations",
    },
    {
        title: "Expenses recorded",
        value: "₹0",
        subtitle: "Total expenditure",
        icon: FiDollarSign,
        path: "/expenses",
    },
    {
        title: "Current balance",
        value: "₹0",
        subtitle: "Donations minus expenses",
        icon: FiBarChart2,
        path: "/reports",
    },
];

function ActivityPanel({ title, children }) {
    return (
        <section className="min-w-0 overflow-hidden rounded-md border border-[#dfddd3] bg-[#fffefd]">
            <div className="flex min-h-16.5 items-center border-b border-[#dfddd3] px-5 sm:px-6">
                <h2 className="text-base font-medium text-[#19251c]">{title}</h2>
            </div>
            {children}
        </section>
    );
}

function EmptyActivity({ message }) {
    return (
        <div className="flex min-h-28 items-center justify-center px-5 py-6 text-center">
            <p className="max-w-xs text-sm leading-6 text-[#777c71]">{message}</p>
        </div>
    );
}

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-[#f8f6f0] md:flex">

            <main className="min-w-0 flex-1 px-5 pb-10 pt-23 sm:px-8 md:px-10 md:py-8 lg:px-12 xl:px-14">
                <div className="mx-auto max-w-360">
                    <header>
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
                    </header>

                    <section
                        aria-label="Summary"
                        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                    >
                        {summaryCards.map(({ title, value, subtitle, icon: Icon, path }) => (
                            <Link
                                key={title}
                                to={path}
                                aria-label={`Open ${title}`}
                                className="group relative block min-w-0 rounded-md border border-[#dfddd3] bg-[#fffefd] p-5 transition duration-200 hover:-translate-y-1 hover:border-[#b9c9b3] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#456748] sm:p-6"
                            >
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
                        ))}
                    </section>

                    <section className="mt-6 grid grid-cols-1 items-start gap-5 xl:grid-cols-2 xl:gap-7">
                        <ActivityPanel title="Recent donations">
                            <EmptyActivity message="No donations recorded yet. Your latest contributions will appear here." />
                        </ActivityPanel>

                        <ActivityPanel title="Recent expenses">
                            <EmptyActivity message="No expenses recorded yet. Your latest spending entries will appear here." />
                        </ActivityPanel>
                    </section>
                </div>
            </main>
        </div>
    );
}
