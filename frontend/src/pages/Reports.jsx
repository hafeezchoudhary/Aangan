
import { useCallback, useEffect, useState } from "react";
import {
  FiDownload,
  FiAlertCircle,
  FiRefreshCw,
  FiBarChart2,
  FiUsers,
  FiHeart,
  FiDollarSign,
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

function escapeCSV(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN");
}

function downloadCSV(filename, records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("There are no records available to export.");
  }

  const columns = Object.keys(records[0]);

  const csv = [
    columns.map(escapeCSV).join(","),
    ...records.map((record) =>
      columns.map((column) => escapeCSV(record[column])).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function normalizeRecords(records, type) {
  if (!Array.isArray(records)) return [];

  if (type === "children") {
    return records.map((child) => ({
      "Child ID": child.childId || "",
      "Full Name": child.fullName || "",
      "Date of Birth": formatDate(child.dateOfBirth),
      Gender: child.gender || "",
      "Admission Date": formatDate(child.admissionDate),
      "Guardian Name": child.guardianName || "",
      Status: child.status || "",
      Notes: child.notes || "",
    }));
  }

  if (type === "donations") {
    return records.map((donation) => ({
      "Donation ID": donation.donationId || "",
      "Donor Name": donation.donorName || "",
      Date: formatDate(donation.date),
      "Payment Method": donation.method || "",
      Amount: Number(donation.amount) || 0,
      Note: donation.note || "",
    }));
  }

  return records.map((expense) => ({
    "Expense ID": expense.expenseId || "",
    Title: expense.title || "",
    Category: expense.category || "",
    Date: formatDate(expense.date),
    Amount: Number(expense.amount) || 0,
    "Payment Method": expense.paymentMethod || "",
    Note: expense.note || "",
  }));
}

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/reports/summary`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load financial reports."
        );
      }

      setReport(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message || "Unable to connect to the reports service."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!exportMessage) return;

    const timeout = setTimeout(() => setExportMessage(""), 4000);

    return () => clearTimeout(timeout);
  }, [exportMessage]);

  async function handleExport(type) {
    setExporting(type);
    setExportMessage("");

    try {
      const endpoints = {
        children: "/api/children",
        donations: "/api/donations",
        expenses: "/api/expenses",
      };

      const response = await fetch(`${API_URL}${endpoints[type]}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to retrieve records.");
      }

      const collectionKey = type;
      const records = normalizeRecords(data[collectionKey], type);

      if (records.length === 0) {
        throw new Error(`No ${type} records are available to export.`);
      }

      downloadCSV(`aaangan-${type}-${new Date().toISOString().slice(0, 10)}.csv`, records);

      setExportMessage(
        `${records.length} ${type} records exported successfully.`
      );
    } catch (err) {
      setExportMessage(err.message || "CSV export failed.");
    } finally {
      setExporting("");
    }
  }

  const categories = report?.spendingByCategory || [];
  const monthlySummary = report?.monthlySummary || [];

  const maximumCategoryAmount = Math.max(
    1,
    ...categories.map((item) => Number(item.amount) || 0)
  );

  const summaryCards = [
    {
      title: "Total donations",
      value: formatCurrency(report?.totalDonations),
      icon: FiHeart,
    },
    {
      title: "Total expenses",
      value: formatCurrency(report?.totalExpenses),
      icon: FiDollarSign,
    },
    {
      title: "Balance",
      value: formatCurrency(report?.balance),
      icon: FiBarChart2,
    },
  ];

  const exportButtons = [
    { type: "children", label: "Children CSV", icon: FiUsers },
    { type: "donations", label: "Donations CSV", icon: FiHeart },
    { type: "expenses", label: "Expenses CSV", icon: FiDollarSign },
  ];

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-4 py-7 text-[#18251c] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-9">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#385b43]">
            Shared accountability
          </p>

          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#18251c]">
            Reports
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#626b61] sm:text-base">
            A simple summary of support and spending, with CSV exports for
            record-keeping practice.
          </p>
        </header>

        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={fetchReport}
              className="inline-flex items-center gap-2 self-start font-semibold underline">
              <FiRefreshCw size={15} />
              Retry
            </button>
          </div>
        )}

        {/* Financial summary */}
        <section
          aria-label="Financial summary"
          className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="min-h-30.25 rounded border border-[#dedbd2] bg-[#fffefd] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#555f54]">
                      {card.title}
                    </p>

                    <p className="mt-2 wrap-break-word font-serif text-3xl text-[#263c2c] sm:text-[34px]">
                      {loading && !report ? "—" : card.value}
                    </p>
                  </div>

                  <Icon
                    size={20}
                    className="mt-1 shrink-0 text-[#385b43]"/>
                </div>
              </article>
            );
          })}
        </section>

        {/* Category and monthly reports */}
        <section className="mb-9 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          {/* Spending by category */}
          <article className="overflow-hidden rounded border border-[#dedbd2] bg-[#fffefd]">
            <div className="border-b border-[#dedbd2] px-6 py-5">
              <h2 className="text-base font-semibold">
                Spending by category
              </h2>
            </div>

            <div className="space-y-5 px-6 py-6">
              {loading && !report ? (
                <p className="py-8 text-sm text-[#788176]">
                  Loading category totals...
                </p>
              ) : categories.length === 0 ? (
                <div className="py-8 text-sm leading-6 text-[#788176]">
                  No expense records are available yet. Spending by category
                  will appear here after expenses are recorded.
                </div>
              ) : (
                categories.map((item) => {
                  const amount = Number(item.amount) || 0;
                  const width = Math.min(
                    100,
                    (amount / maximumCategoryAmount) * 100
                  );

                  return (
                    <div key={item.category}>
                      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                        <span className="font-medium text-[#1e2a21]">
                          {item.category}
                        </span>

                        <span className="shrink-0 text-[#667064]">
                          {formatCurrency(amount)}
                        </span>
                      </div>

                      <div
                        className="h-2.25 overflow-hidden rounded-full bg-[#f0eddf]"
                        role="progressbar"
                        aria-label={`${item.category} spending`}
                        aria-valuenow={amount}
                        aria-valuemin={0}
                        aria-valuemax={maximumCategoryAmount}>
                        <div
                          className="h-full rounded-full bg-[#385b43] transition-all duration-500"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          {/* Month by month */}
          <article className="overflow-hidden rounded border border-[#dedbd2] bg-[#fffefd]">
            <div className="border-b border-[#dedbd2] px-6 py-5">
              <h2 className="text-base font-semibold">Month by month</h2>
            </div>

            {loading && !report ? (
              <div className="px-6 py-10 text-sm text-[#788176]">
                Loading monthly summaries...
              </div>
            ) : monthlySummary.length === 0 ? (
              <div className="px-6 py-10 text-sm leading-6 text-[#788176]">
                Monthly donation and expense summaries will appear here when
                financial records are available.
              </div>
            ) : (
              <div className="divide-y divide-[#dedbd2]">
                {monthlySummary.map((month) => (
                  <div
                    key={`${month.year}-${month.month}`}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-[#1e2a21]">
                      {month.label}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                      <span className="font-medium text-[#385b43]">
                        +{formatCurrency(month.donations)}
                      </span>

                      <span className="font-medium text-[#202921]">
                        −{formatCurrency(month.expenses)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>

        {/* CSV exports */}
        <section className="overflow-hidden rounded border border-[#dedbd2] bg-[#fffefd]">
          <div className="border-b border-[#dedbd2] px-6 py-5">
            <h2 className="text-base font-semibold">Export records</h2>
          </div>

          <div className="flex flex-wrap gap-3 px-6 py-6">
            {exportButtons.map((button) => {
              const Icon = button.icon;
              const isExporting = exporting === button.type;

              return (
                <button
                  key={button.type}
                  type="button"
                  onClick={() => handleExport(button.type)}
                  disabled={Boolean(exporting)}
                  className="inline-flex min-h-11 items-center justify-center gap-3 rounded border border-[#dedbd2] bg-[#faf9f5] px-4 py-2.5 text-sm font-medium text-[#26352a] shadow-sm transition hover:bg-[#f0eee5] disabled:cursor-not-allowed disabled:opacity-60">
                  {isExporting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d5ddcf] border-t-[#385b43]" />
                  ) : (
                    <Icon size={17} />
                  )}

                  {isExporting ? "Exporting..." : button.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#dedbd2] px-6 py-5">
            {exportMessage ? (
              <p
                role="status"
                className="mb-2 text-sm text-[#385b43]">
                {exportMessage}
              </p>
            ) : null}

            <p className="text-xs leading-5 text-[#737d71]">
              Exports contain records retrieved from the Aaangan backend.
              {lastUpdated
                ? ` Last updated ${lastUpdated.toLocaleString("en-IN")}.`
                : ""}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
