
import { useCallback, useEffect, useState } from "react";
import {
  FiArrowDownLeft,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
  FiDollarSign,
  FiFileText,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const CATEGORIES = [
  "Food",
  "Education",
  "Healthcare",
  "Clothing",
  "Utilities",
  "Maintenance",
  "Transportation",
  "Other",
];

const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Bank transfer",
  "Cheque",
  "Other",
];

const EMPTY_FORM = {
  title: "",
  category: "Food",
  date: new Date().toLocaleDateString("en-CA"),
  amount: "",
  paymentMethod: "UPI",
  note: "",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(data, fallback) {
  return data?.message || fallback;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/expenses?search=${encodeURIComponent(search)}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to load expenses.")
        );
      }

      setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
      setTotalAmount(Number(data.totalAmount) || 0);
      setTotalCount(Number(data.count) || 0);
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    if (!notice) return;

    const timeout = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function openAddModal() {
    setEditingExpense(null);
    setForm({
      ...EMPTY_FORM,
      date: new Date().toLocaleDateString("en-CA"),
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(expense) {
    setEditingExpense(expense);
    setForm({
      title: expense.title || "",
      category: expense.category || "Other",
      date: expense.date
        ? new Date(expense.date).toLocaleDateString("en-CA")
        : new Date().toLocaleDateString("en-CA"),
      amount: String(expense.amount ?? ""),
      paymentMethod: expense.paymentMethod || "Other",
      note: expense.note || "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingExpense(null);
    setForm(EMPTY_FORM);
    setFormError("");
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Please enter an expense title.");
      return;
    }

    if (!form.date) {
      setFormError("Please select the expense date.");
      return;
    }

    if (!form.amount || !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      category: form.category,
      date: form.date,
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      note: form.note.trim(),
    };

    try {
      const isEditing = Boolean(editingExpense);

      const response = await fetch(
        isEditing
          ? `${API_URL}/api/expenses/${editingExpense._id}`
          : `${API_URL}/api/expenses`,
        {
          method: isEditing ? "PUT" : "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to save the expense.")
        );
      }

      setModalOpen(false);
      setEditingExpense(null);
      setForm(EMPTY_FORM);
      setNotice(
        isEditing
          ? "Expense updated successfully."
          : "Expense added successfully."
      );

      await fetchExpenses();
    } catch (err) {
      setFormError(
        err.message || "Unable to save the expense. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/expenses/${deleteTarget._id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Unable to delete the expense.")
        );
      }

      setDeleteTarget(null);
      setNotice("Expense deleted successfully.");

      await fetchExpenses();
    } catch (err) {
      setError(err.message || "Unable to delete the expense.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f6f0] px-4 py-6 text-[#26372d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#71816f]">
              <span>Admin</span>
              <span>/</span>
              <span className="text-[#385b43]">Expenses</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Expense Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#788176] sm:text-base">
              Track and manage the spending of your organisation.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#385b43] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#294733] focus:outline-none focus:ring-2 focus:ring-[#385b43] focus:ring-offset-2"
          >
            <FiPlus size={18} />
            Add Expense
          </button>
        </div>

        {/* Notifications */}
        {notice && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#d7e6d7] bg-[#edf5eb] px-4 py-3 text-sm font-medium text-[#385b43]"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <FiX size={18} />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2">
              <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
              <span>{error}</span>
            </div>

            <button
              type="button"
              onClick={fetchExpenses}
              className="inline-flex items-center gap-2 self-start font-semibold underline sm:self-center"
            >
              <FiRefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section
          aria-label="Expense summary"
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <div className="rounded-2xl border border-[#e9e5da] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#7c8579]">
                  Total Expenditure
                </p>

                <p className="mt-3 break-words text-2xl font-bold tracking-tight text-[#26372d] sm:text-3xl">
                  {formatCurrency(totalAmount)}
                </p>

                <p className="mt-2 text-xs text-[#8a9286]">
                  Across all recorded expenses
                </p>
              </div>

              <div className="rounded-xl bg-[#f0f3e8] p-3 text-[#52724d]">
                <FiDollarSign size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e9e5da] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#7c8579]">
                  Matching Records
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-[#26372d]">
                  {totalCount}
                </p>

                <p className="mt-2 text-xs text-[#8a9286]">
                  {search.trim()
                    ? "Records matching your search"
                    : "Total recorded expenses"}
                </p>
              </div>

              <div className="rounded-xl bg-[#f8efe3] p-3 text-[#a47740]">
                <FiFileText size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e9e5da] bg-white p-5 shadow-sm sm:col-span-2 sm:p-6 xl:col-span-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#7c8579]">
                  Current View
                </p>

                <p className="mt-3 text-xl font-bold text-[#26372d]">
                  {search.trim() ? "Search Results" : "All Expenses"}
                </p>

                <p className="mt-2 text-xs text-[#8a9286]">
                  {search.trim()
                    ? "Use the search field to refine results"
                    : "Your complete expense register"}
                </p>
              </div>

              <div className="rounded-xl bg-[#f3eee8] p-3 text-[#896a4b]">
                <FiCalendar size={23} />
              </div>
            </div>
          </div>
        </section>

        {/* Expense records */}
        <section className="overflow-hidden rounded-2xl border border-[#e9e5da] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#eeeae1] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#26372d]">
                Expense Records
              </h2>

              <p className="mt-1 text-sm text-[#858d81]">
                Review, search, update, or remove expense records.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <FiSearch
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929a8f]"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search expenses..."
                aria-label="Search expenses"
                className="min-h-11 w-full rounded-xl border border-[#e5e3da] bg-[#fdfcf9] py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-[#a0a69c] focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#dce5d8] border-t-[#385b43]" />
              <p className="text-sm text-[#7c8579]">
                Loading expense records...
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-[#f2f3eb] p-4 text-[#688064]">
                {search.trim() ? (
                  <FiSearch size={28} />
                ) : (
                  <FiArrowDownLeft size={28} />
                )}
              </div>

              <h3 className="text-base font-bold text-[#354638]">
                {search.trim()
                  ? "No matching expenses"
                  : "No expenses recorded yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-[#858d81]">
                {search.trim()
                  ? "Try a different search term or clear your search."
                  : "Start by recording an expense. Your saved records will appear here."}
              </p>

              {search.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-[#385b43] hover:bg-[#f1f3ed]"
                >
                  Clear search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#385b43] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#294733]"
                >
                  <FiPlus size={16} />
                  Add your first expense
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-[#eeeae1] md:hidden">
                {expenses.map((expense) => (
                  <article key={expense._id} className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-[#2e4033]">
                          {expense.title}
                        </h3>

                        <p className="mt-1 text-xs text-[#92998f]">
                          {expense.expenseId || "—"} · {formatDate(expense.date)}
                        </p>
                      </div>

                      <p className="shrink-0 text-base font-bold text-[#385b43]">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#f0f3e8] px-3 py-1 text-xs font-medium text-[#52724d]">
                        {expense.category}
                      </span>

                      <span className="rounded-full bg-[#f6f1e9] px-3 py-1 text-xs font-medium text-[#8a704e]">
                        {expense.paymentMethod}
                      </span>
                    </div>

                    {expense.note && (
                      <p className="break-words text-sm leading-5 text-[#858d81]">
                        {expense.note}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 border-t border-[#f0ede6] pt-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(expense)}
                        aria-label={`Edit ${expense.title}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e4e7dc] px-3 text-sm font-medium text-[#526b4d] hover:bg-[#f3f5ee]"
                      >
                        <FiEdit2 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(expense)}
                        aria-label={`Delete ${expense.title}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-100 px-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-[#faf9f5]">
                    <tr className="border-b border-[#eeeae1]">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#7c8579]">
                        Expense
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#7c8579]">
                        Category
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#7c8579]">
                        Date
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[#7c8579]">
                        Payment
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#7c8579]">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#7c8579]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#f0ede6]">
                    {expenses.map((expense) => (
                      <tr
                        key={expense._id}
                        className="transition hover:bg-[#fdfcf9]"
                      >
                        <td className="max-w-xs px-6 py-4">
                          <p className="break-words font-semibold text-[#344638]">
                            {expense.title}
                          </p>

                          <p className="mt-1 text-xs text-[#969d92]">
                            {expense.expenseId || "—"}
                          </p>

                          {expense.note && (
                            <p className="mt-1 max-w-xs truncate text-xs text-[#858d81]">
                              {expense.note}
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-[#f0f3e8] px-3 py-1.5 text-xs font-medium text-[#52724d]">
                            {expense.category}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-[#737e71]">
                          {formatDate(expense.date)}
                        </td>

                        <td className="px-6 py-4 text-sm text-[#737e71]">
                          {expense.paymentMethod}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right font-semibold text-[#344638]">
                          {formatCurrency(expense.amount)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              aria-label={`Edit ${expense.title}`}
                              title="Edit expense"
                              className="rounded-lg border border-[#e5e8df] p-2.5 text-[#587451] transition hover:bg-[#f0f3e8]"
                            >
                              <FiEdit2 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTarget(expense)}
                              aria-label={`Delete ${expense.title}`}
                              title="Delete expense"
                              className="rounded-lg border border-red-100 p-2.5 text-red-500 transition hover:bg-red-50"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#eeeae1] bg-[#fdfcf9] px-5 py-4 text-xs text-[#858d81] sm:px-6">
                Showing {expenses.length} matching{" "}
                {expenses.length === 1 ? "record" : "records"}.
                {search.trim() && " The total expenditure above includes all records."}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#17251b]/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-modal-title"
            className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#eeeae1] bg-white px-5 py-5 sm:px-7">
              <div>
                <h2
                  id="expense-modal-title"
                  className="text-xl font-bold text-[#2d4032]"
                >
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </h2>

                <p className="mt-1 text-sm text-[#858d81]">
                  {editingExpense
                    ? "Update the expense details below."
                    : "Enter the details of the expenditure."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-[#7d887b] transition hover:bg-[#f3f3ed] disabled:opacity-50"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6 sm:px-7">
              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="expense-title"
                  className="mb-2 block text-sm font-semibold text-[#425244]"
                >
                  Expense title <span className="text-red-500">*</span>
                </label>

                <input
                  id="expense-title"
                  name="title"
                  type="text"
                  value={form.title}
                  onChange={handleFormChange}
                  maxLength={150}
                  required
                  placeholder="e.g. Monthly groceries"
                  className="min-h-11 w-full rounded-xl border border-[#e2e4da] px-4 py-3 text-sm outline-none transition focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="expense-category"
                    className="mb-2 block text-sm font-semibold text-[#425244]"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="expense-category"
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                    className="min-h-11 w-full rounded-xl border border-[#e2e4da] bg-white px-3 py-3 text-sm outline-none focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="expense-date"
                    className="mb-2 block text-sm font-semibold text-[#425244]"
                  >
                    Expense date <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="expense-date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleFormChange}
                    required
                    className="min-h-11 w-full rounded-xl border border-[#e2e4da] bg-white px-3 py-3 text-sm outline-none focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="expense-amount"
                    className="mb-2 block text-sm font-semibold text-[#425244]"
                  >
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="expense-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleFormChange}
                    required
                    placeholder="0.00"
                    className="min-h-11 w-full rounded-xl border border-[#e2e4da] px-4 py-3 text-sm outline-none focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="expense-payment"
                    className="mb-2 block text-sm font-semibold text-[#425244]"
                  >
                    Payment method
                  </label>

                  <select
                    id="expense-payment"
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleFormChange}
                    className="min-h-11 w-full rounded-xl border border-[#e2e4da] bg-white px-3 py-3 text-sm outline-none focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="expense-note"
                  className="mb-2 block text-sm font-semibold text-[#425244]"
                >
                  Notes <span className="font-normal text-[#969d92]">(optional)</span>
                </label>

                <textarea
                  id="expense-note"
                  name="note"
                  value={form.note}
                  onChange={handleFormChange}
                  maxLength={1000}
                  rows={3}
                  placeholder="Add details about this expense..."
                  className="w-full resize-y rounded-xl border border-[#e2e4da] px-4 py-3 text-sm outline-none transition placeholder:text-[#a0a69c] focus:border-[#789477] focus:ring-2 focus:ring-[#789477]/20"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#eeeae1] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-11 rounded-xl border border-[#e2e4da] px-5 py-3 text-sm font-semibold text-[#637062] transition hover:bg-[#f8f7f2] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#385b43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294733] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {saving
                    ? "Saving..."
                    : editingExpense
                      ? "Save Changes"
                      : "Save Expense"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#17251b]/50 p-4 backdrop-blur-[2px]">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-expense-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-4 inline-flex rounded-xl bg-red-50 p-3 text-red-600">
              <FiTrash2 size={23} />
            </div>

            <h2
              id="delete-expense-title"
              className="text-xl font-bold text-[#2d4032]"
            >
              Delete expense?
            </h2>

            <p className="mt-3 break-words text-sm leading-6 text-[#788176]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#344638]">
                {deleteTarget.title}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="min-h-11 rounded-xl border border-[#e2e4da] px-5 py-3 text-sm font-semibold text-[#637062] hover:bg-[#f8f7f2] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
