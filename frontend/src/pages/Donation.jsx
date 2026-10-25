
import { useCallback, useEffect, useState } from "react";
import {
  FiArrowDownLeft,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const PAYMENT_METHODS = [
  "Bank transfer",
  "UPI",
  "Cash",
  "Cheque",
  "Other",
];

const EMPTY_FORM = {
  donorName: "",
  date: new Date().toLocaleDateString("en-CA"),
  method: "UPI",
  amount: "",
  note: "",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "The request could not be completed."
    );
  }

  return data;
}

function Notice({ message, type = "success", onClose }) {
  if (!message) return null;

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`mt-5 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${type === "error"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-[#c9dcc4] bg-[#edf4e9] text-[#294c32]"
        }`}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <FiX size={18} />
      </button>
    </div>
  );
}

export default function Donation() {
  const [donations, setDonations] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDonations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();
      const response = await fetch(
        `${API_URL}/api/donations${query ? `?${query}` : ""}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await readResponse(response);
      setDonations(Array.isArray(data.donations) ? data.donations : []);
      setTotalAmount(Number(data.totalAmount) || 0);
    } catch (err) {
      setError(
        err.message ||
        "Could not load donations. Check that the backend is running and you are logged in."
      );
      setDonations([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  function openAddModal() {
    setEditingDonation(null);
    setForm({
      ...EMPTY_FORM,
      date: new Date().toLocaleDateString("en-CA"),
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function openEditModal(donation) {
    setEditingDonation(donation);
    setForm({
      donorName: donation.donorName || "",
      date: dateInputValue(donation.date),
      method: donation.method || "Other",
      amount: String(donation.amount ?? ""),
      note: donation.note || "",
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingDonation(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const editing = Boolean(editingDonation);
      const endpoint = editing
        ? `${API_URL}/api/donations/${editingDonation._id}`
        : `${API_URL}/api/donations`;

      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          donorName: form.donorName.trim(),
          date: form.date,
          method: form.method,
          amount: Number(form.amount),
          note: form.note.trim(),
        }),
      });

      await readResponse(response);

      setModalOpen(false);
      setEditingDonation(null);
      setForm(EMPTY_FORM);
      setNotice(
        editing
          ? "Donation updated successfully."
          : "Donation recorded successfully."
      );

      await loadDonations();
    } catch (err) {
      setError(err.message || "Could not save the donation.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API_URL}/api/donations/${deleteTarget._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      await readResponse(response);

      setDeleteTarget(null);
      setNotice("Donation deleted successfully.");
      await loadDonations();
    } catch (err) {
      setDeleteTarget(null);
      setError(err.message || "Could not delete the donation.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-w-0 px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pt-10 lg:px-10 xl:px-12">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#39553c]">
              Finance
            </p>

            <h1 className="mt-1 font-serif text-4xl font-medium tracking-tight text-[#19251c] sm:text-5xl">
              Donations
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#596257] sm:text-base">
              Record community contributions and keep track of the support
              received by Aaangan.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-md bg-[#315337] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#253f2b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#456748] focus-visible:ring-offset-2 sm:self-auto"
          >
            <FiPlus size={18} />
            Add donation
          </button>
        </header>

        <Notice
          message={error && !modalOpen ? error : ""}
          type="error"
          onClose={() => setError("")}
        />

        <Notice
          message={notice}
          onClose={() => setNotice("")}
        />

        <section
          aria-label="Donation summary"
          className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="rounded-md border border-[#dfddd3] bg-[#fffefd] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-[#596257]">Total donations received</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e0eadb] text-[#35563a]">
                <FiArrowDownLeft size={21} />
              </span>
            </div>

            <p className="mt-4 break-words font-serif text-3xl font-medium text-[#19251c] sm:text-4xl">
              {loading ? "Loading..." : formatCurrency(totalAmount)}
            </p>

            <p className="mt-2 text-sm text-[#697165]">
              Sum of all recorded contributions
            </p>
          </div>

          <div className="rounded-md border border-[#dfddd3] bg-[#fffefd] p-5 sm:p-6">
            <p className="text-sm text-[#596257]">Donation records</p>

            <p className="mt-4 font-serif text-3xl font-medium text-[#19251c] sm:text-4xl">
              {loading ? "—" : donations.length}
            </p>

            <p className="mt-2 text-sm text-[#697165]">
              {search.trim()
                ? "Matching records for your search"
                : "Records currently displayed"}
            </p>
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-md border border-[#dfddd3] bg-[#fffefd]">
          <div className="flex flex-col gap-4 border-b border-[#dfddd3] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="text-base font-semibold text-[#19251c]">
                All donations
              </h2>
              <p className="mt-1 text-sm text-[#697165]">
                Search and manage contribution records.
              </p>
            </div>

            <label className="flex min-h-11 w-full items-center gap-3 rounded-md border border-[#dfddd3] bg-[#fffefd] px-3 sm:max-w-sm">
              <FiSearch className="shrink-0 text-[#687367]" size={18} />
              <span className="sr-only">Search donations</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search donor, ID or method..."
                className="min-w-0 flex-1 bg-transparent text-sm text-[#19251c] outline-none placeholder:text-[#7a8177]"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#dfddd3] text-xs font-semibold text-[#596257]">
                  <th className="px-5 py-4">Donation ID</th>
                  <th className="px-4 py-4">Donor</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Method</th>
                  <th className="px-4 py-4 text-right">Amount</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#697165]">
                      Loading donations...
                    </td>
                  </tr>
                ) : error && donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center text-sm text-[#697165]">
                      Donations could not be loaded. Check your connection and login.
                    </td>
                  </tr>
                ) : donations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <p className="text-base font-medium text-[#19251c]">
                        {search.trim()
                          ? "No matching donations"
                          : "No donations recorded yet"}
                      </p>
                      <p className="mt-2 text-sm text-[#777c71]">
                        {search.trim()
                          ? "Try another search term."
                          : "Add a donation to see it appear here."}
                      </p>

                      {!search.trim() && (
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#315337] hover:underline"
                        >
                          <FiPlus size={16} />
                          Add the first donation
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  donations.map((donation) => (
                    <tr
                      key={donation._id}
                      className="border-b border-[#e5e1d8] last:border-b-0 hover:bg-[#faf9f4]"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-[#315337]">
                        {donation.donationId || "—"}
                      </td>

                      <td className="max-w-[240px] px-4 py-4">
                        <p className="break-words text-sm font-medium text-[#19251c]">
                          {donation.donorName}
                        </p>
                        {donation.note && (
                          <p className="mt-1 max-w-[220px] break-words text-xs text-[#777c71]">
                            {donation.note}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#596257]">
                        {formatDate(donation.date)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#596257]">
                        {donation.method}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold tabular-nums text-[#19251c]">
                        {formatCurrency(donation.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(donation)}
                            aria-label={`Edit donation ${donation.donationId || ""}`}
                            className="rounded p-2 text-[#315337] transition hover:bg-[#e0eadb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#456748]"
                          >
                            <FiEdit2 size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(donation)}
                            aria-label={`Delete donation ${donation.donationId || ""}`}
                            className="rounded p-2 text-[#9b4036] transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          >
                            <FiTrash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#dfddd3] px-5 py-3 text-xs text-[#777c71] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {loading
                ? "Loading records..."
                : `${donations.length} ${donations.length === 1 ? "record" : "records"
                } displayed`}
            </span>

            <button
              type="button"
              onClick={loadDonations}
              disabled={loading}
              className="self-start font-medium text-[#315337] hover:underline disabled:opacity-50 sm:self-auto"
            >
              Refresh records
            </button>
          </div>
        </section>
      </div>
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-modal-title"
            className="my-auto w-full max-w-xl rounded-lg border border-[#dfddd3] bg-[#f8f6f0] p-5 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="donation-modal-title"
                  className="text-xl font-semibold text-[#19251c] sm:text-2xl"
                >
                  {editingDonation ? "Edit donation" : "Record a donation"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#687367]">
                  {editingDonation
                    ? "Update the details of this contribution."
                    : "Enter the details of the contribution received."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
                className="rounded p-1 text-[#687367] hover:bg-[#eae7dd] disabled:opacity-50"
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="donorName"
                  className="mb-1.5 block text-sm font-medium text-[#19251c]"
                >
                  Donor name <span className="text-red-700">*</span>
                </label>
                <input
                  id="donorName"
                  name="donorName"
                  value={form.donorName}
                  onChange={handleChange}
                  required
                  maxLength={150}
                  autoFocus
                  placeholder="Enter donor name"
                  className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-4 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="date"
                    className="mb-1.5 block text-sm font-medium text-[#19251c]"
                  >
                    Donation date <span className="text-red-700">*</span>
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    max={new Date().toLocaleDateString("en-CA")}
                    className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="method"
                    className="mb-1.5 block text-sm font-medium text-[#19251c]"
                  >
                    Payment method <span className="text-red-700">*</span>
                  </label>
                  <select
                    id="method"
                    name="method"
                    value={form.method}
                    onChange={handleChange}
                    required
                    className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
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
                  htmlFor="amount"
                  className="mb-1.5 block text-sm font-medium text-[#19251c]"
                >
                  Amount (₹) <span className="text-red-700">*</span>
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  required
                  min="0.01"
                  max="1000000000"
                  step="0.01"
                  placeholder="Enter amount"
                  className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-4 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                />
              </div>

              <div>
                <label
                  htmlFor="note"
                  className="mb-1.5 block text-sm font-medium text-[#19251c]"
                >
                  Note <span className="text-[#777c71]">(optional)</span>
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  maxLength={1000}
                  rows={3}
                  placeholder="Add a short note about this donation"
                  className="w-full resize-y rounded-md border border-[#d9d6cb] bg-[#fffefd] px-4 py-3 text-sm outline-none placeholder:text-[#7a8177] focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {error}
                </div>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 pt-1 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-11 rounded-md border border-[#d9d6cb] bg-[#fffefd] px-5 text-sm font-medium text-[#19251c] hover:bg-[#efede5] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#315337] px-5 text-sm font-medium text-white hover:bg-[#253f2b] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingDonation
                      ? "Save changes"
                      : "Record donation"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-donation-title"
            className="w-full max-w-md rounded-xl border border-[#dfddd3] bg-[#fffefd] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#9b4036]">
                <FiTrash2 size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-donation-title"
                  className="text-lg font-semibold text-[#19251c]"
                >
                  Delete donation?
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#596257]">
                  Delete the donation from{" "}
                  <span className="font-semibold">
                    {deleteTarget.donorName}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold">
                    {formatCurrency(deleteTarget.amount)}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                aria-label="Close confirmation"
                className="rounded p-1 text-[#687367] hover:bg-[#efede5] disabled:opacity-50"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="min-h-10 rounded-md border border-[#d9d6cb] px-4 text-sm font-medium text-[#19251c] hover:bg-[#f3f1e9] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="min-h-10 rounded-md bg-[#9b4036] px-4 text-sm font-medium text-white hover:bg-[#80332b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete donation"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
