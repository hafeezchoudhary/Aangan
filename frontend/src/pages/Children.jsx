
import { useCallback, useEffect, useState } from "react";
import {
    FiArchive,
    FiCheck,
    FiChevronDown,
    FiEdit2,
    FiPlus,
    FiRotateCcw,
    FiSearch,
    FiX,
} from "react-icons/fi";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const EMPTY_FORM = {
    fullName: "",
    dateOfBirth: "",
    gender: "Girl",
    admissionDate: new Date().toLocaleDateString("en-CA"),
    guardianName: "",
    notes: "",
};

function getDateInputValue(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
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

function getErrorMessage(data, fallback) {
    return data?.message || fallback;
}

export default function Children() {
    const [children, setChildren] = useState([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingChild, setEditingChild] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);

    const loadChildren = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (search.trim()) params.set("search", search.trim());
            if (status !== "all") params.set("status", status);

            const query = params.toString();
            const response = await fetch(
                `${API_URL}/api/children${query ? `?${query}` : ""}`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(data, "Unable to load child records.")
                );
            }

            setChildren(Array.isArray(data.children) ? data.children : []);
        } catch (err) {
            setError(
                err.message ||
                "Could not connect to the server. Check that the backend is running."
            );
            setChildren([]);
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    useEffect(() => {
        loadChildren();
    }, [loadChildren]);

    const activeCount = children.filter(
        (child) => child.status === "Active"
    ).length;

    function openAddModal() {
        setEditingChild(null);
        setForm({
            ...EMPTY_FORM,
            admissionDate: getDateInputValue(new Date()),
        });
        setError("");
        setNotice("");
        setModalOpen(true);
    }

    function openEditModal(child) {
        setEditingChild(child);
        setForm({
            fullName: child.fullName || "",
            dateOfBirth: getDateInputValue(child.dateOfBirth),
            gender: child.gender || "Girl",
            admissionDate: getDateInputValue(child.admissionDate),
            guardianName: child.guardianName || "",
            notes: child.notes || "",
        });
        setError("");
        setNotice("");
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;

        setModalOpen(false);
        setEditingChild(null);
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
            const editing = Boolean(editingChild);
            const endpoint = editing
                ? `${API_URL}/api/children/${editingChild._id}`
                : `${API_URL}/api/children`;

            const response = await fetch(endpoint, {
                method: editing ? "PUT" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(data, "Unable to save the child record.")
                );
            }

            setModalOpen(false);
            setEditingChild(null);
            setForm(EMPTY_FORM);
            setNotice(
                editing
                    ? "Child record updated successfully."
                    : "Child record added successfully."
            );

            await loadChildren();
        } catch (err) {
            setError(
                err.message ||
                "Could not save the record. Please check your connection."
            );
        } finally {
            setSaving(false);
        }
    }

    async function changeStatus(child, action) {
        const restoring = action === "restore";

        const confirmed = window.confirm(
            restoring
                ? `Restore ${child.fullName}'s record to Active status?`
                : `Archive ${child.fullName}'s record? The record will be retained for historical reference.`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_URL}/api/children/${child._id}/${action}`,
                {
                    method: "PATCH",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(data, "Unable to update the record status.")
                );
            }

            setNotice(
                restoring
                    ? "Child record restored successfully."
                    : "Child record archived successfully."
            );

            await loadChildren();
        } catch (err) {
            setError(err.message || "Could not update the record.");
        }
    }

    return (
        <main className="min-w-0 px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pt-10 lg:px-10 xl:px-12">
            <div className="mx-auto max-w-[1440px]">
                <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#39553c]">
                            Records
                        </p>

                        <h1 className="mt-1 font-serif text-4xl font-medium tracking-tight text-[#19251c] sm:text-5xl">
                            Children
                        </h1>

                        <p className="mt-3 text-sm text-[#596257] sm:text-base">
                            {loading
                                ? "Loading records..."
                                : `${children.length} ${children.length === 1 ? "record" : "records"
                                } shown · ${activeCount} active`}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-md bg-[#315337] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#253f2b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#456748] focus-visible:ring-offset-2 sm:self-auto"
                    >
                        <FiPlus size={18} />
                        Add record
                    </button>
                </header>

                {error && !modalOpen && (
                    <div
                        role="alert"
                        className="mt-5 flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="mt-5 flex items-start justify-between gap-3 rounded-md border border-[#c9dcc4] bg-[#edf4e9] px-4 py-3 text-sm text-[#294c32]"
                    >
                        <span className="flex items-center gap-2">
                            <FiCheck size={17} />
                            {notice}
                        </span>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss notification"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                )}

                <section className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-md border border-[#dfddd3] bg-[#fffefd] px-4 shadow-sm focus-within:border-[#82977a]">
                        <FiSearch className="shrink-0 text-[#687367]" size={19} />
                        <span className="sr-only">Search children</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, ID or contact..."
                            className="min-w-0 flex-1 bg-transparent text-sm text-[#19251c] outline-none placeholder:text-[#7a8177]"
                        />
                    </label>

                    <label className="relative flex min-h-11 min-w-[170px] items-center rounded-md border border-[#dfddd3] bg-[#fffefd] shadow-sm">
                        <span className="sr-only">Filter by status</span>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-full w-full appearance-none bg-transparent px-4 pr-10 text-sm text-[#19251c] outline-none"
                        >
                            <option value="all">All statuses</option>
                            <option value="Active">Active</option>
                            <option value="Archived">Archived</option>
                        </select>
                        <FiChevronDown
                            className="pointer-events-none absolute right-3 text-[#7a8177]"
                            size={17}
                        />
                    </label>
                </section>

                <section className="mt-5 overflow-hidden rounded-md border border-[#dfddd3] bg-[#fffefd]">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-[#dfddd3] text-xs font-semibold text-[#596257]">
                                    <th className="px-5 py-4">Child</th>
                                    <th className="px-4 py-4">Date of birth</th>
                                    <th className="px-4 py-4">Admitted</th>
                                    <th className="px-4 py-4">Guardian contact</th>
                                    <th className="px-4 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-14 text-center text-sm text-[#697165]"
                                        >
                                            Loading child records...
                                        </td>
                                    </tr>
                                ) : children.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-14 text-center"
                                        >
                                            <p className="text-base font-medium text-[#19251c]">
                                                {error
                                                    ? "Records could not be loaded"
                                                    : "No child records found"}
                                            </p>
                                            <p className="mt-2 text-sm text-[#777c71]">
                                                {error
                                                    ? "Check your backend connection and try again."
                                                    : search || status !== "all"
                                                        ? "Try changing your search or status filter."
                                                        : "Select Add record to register the first child."}
                                            </p>
                                            {!error && !search && status === "all" && (
                                                <button
                                                    type="button"
                                                    onClick={openAddModal}
                                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#315337] hover:underline"
                                                >
                                                    <FiPlus size={16} />
                                                    Add the first record
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    children.map((child) => (
                                        <tr
                                            key={child._id}
                                            className="border-b border-[#e5e1d8] last:border-b-0 hover:bg-[#faf9f4]"
                                        >
                                            <td className="max-w-[310px] px-5 py-4">
                                                <p className="font-medium text-[#19251c]">
                                                    {child.fullName}
                                                </p>
                                                <p className="mt-1 break-words text-xs leading-5 text-[#687367]">
                                                    {child.childId || "ID pending"}
                                                    {" · "}
                                                    {child.gender}
                                                    {child.notes ? ` · ${child.notes}` : ""}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-[#19251c]">
                                                {formatDate(child.dateOfBirth)}
                                            </td>

                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-[#19251c]">
                                                {formatDate(child.admissionDate)}
                                            </td>

                                            <td className="max-w-[200px] break-words px-4 py-4 text-sm text-[#19251c]">
                                                {child.guardianName || "—"}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex rounded px-3 py-1 text-xs font-semibold ${child.status === "Active"
                                                            ? "bg-[#315337] text-white"
                                                            : "bg-[#ece9df] text-[#686b60]"
                                                        }`}
                                                >
                                                    {child.status}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(child)}
                                                        className="inline-flex items-center gap-1.5 text-sm text-[#263b2b] hover:text-[#547a4f] focus:outline-none focus-visible:underline"
                                                    >
                                                        <FiEdit2 size={17} />
                                                        Edit
                                                    </button>

                                                    {child.status === "Active" ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                changeStatus(child, "archive")
                                                            }
                                                            className="inline-flex items-center gap-1.5 text-sm text-[#26332a] hover:text-[#8c4b3e] focus:outline-none focus-visible:underline"
                                                        >
                                                            <FiArchive size={17} />
                                                            Archive
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                changeStatus(child, "restore")
                                                            }
                                                            className="inline-flex items-center gap-1.5 text-sm text-[#263b2b] hover:text-[#547a4f] focus:outline-none focus-visible:underline"
                                                        >
                                                            <FiRotateCcw size={17} />
                                                            Restore
                                                        </button>
                                                    )}
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
                            {children.length} {children.length === 1 ? "record" : "records"}
                            {" displayed"}
                        </span>

                        <button
                            type="button"
                            onClick={loadChildren}
                            disabled={loading}
                            className="inline-flex items-center gap-2 self-start font-medium text-[#315337] hover:underline disabled:opacity-50 sm:self-auto"
                        >
                            <FiRotateCcw size={14} />
                            Refresh records
                        </button>
                    </div>
                </section>
            </div>

            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-3 sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="child-modal-title"
                        className="my-auto w-full max-w-[650px] rounded-lg border border-[#dfddd3] bg-[#f8f6f0] p-5 shadow-2xl sm:p-8"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="child-modal-title"
                                    className="text-xl font-semibold text-[#19251c] sm:text-2xl"
                                >
                                    {editingChild ? "Edit record" : "Add a record"}
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-[#687367]">
                                    Child records are saved securely to the home&apos;s database.
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
                                    htmlFor="fullName"
                                    className="mb-1.5 block text-sm font-medium text-[#19251c]"
                                >
                                    Full name <span className="text-red-700">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                    autoFocus
                                    className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-4 text-sm outline-none transition focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="dateOfBirth"
                                        className="mb-1.5 block text-sm font-medium text-[#19251c]"
                                    >
                                        Date of birth <span className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={form.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                        max={getDateInputValue(new Date())}
                                        className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="gender"
                                        className="mb-1.5 block text-sm font-medium text-[#19251c]"
                                    >
                                        Gender <span className="text-red-700">*</span>
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleChange}
                                        required
                                        className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                                    >
                                        <option value="Girl">Girl</option>
                                        <option value="Boy">Boy</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="admissionDate"
                                        className="mb-1.5 block text-sm font-medium text-[#19251c]"
                                    >
                                        Admission date <span className="text-red-700">*</span>
                                    </label>
                                    <input
                                        id="admissionDate"
                                        name="admissionDate"
                                        type="date"
                                        value={form.admissionDate}
                                        onChange={handleChange}
                                        required
                                        min={form.dateOfBirth || undefined}
                                        max={getDateInputValue(new Date())}
                                        className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 text-sm outline-none focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="guardianName"
                                        className="mb-1.5 block text-sm font-medium text-[#19251c]"
                                    >
                                        Guardian contact
                                    </label>
                                    <input
                                        id="guardianName"
                                        name="guardianName"
                                        value={form.guardianName}
                                        onChange={handleChange}
                                        maxLength={150}
                                        placeholder="Name · phone"
                                        className="min-h-11 w-full rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 text-sm outline-none placeholder:text-[#7a8177] focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="notes"
                                    className="mb-1.5 block text-sm font-medium text-[#19251c]"
                                >
                                    Notes
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    maxLength={2000}
                                    rows={3}
                                    placeholder="Optional notes"
                                    className="w-full resize-y rounded-md border border-[#d9d6cb] bg-[#fffefd] px-3 py-3 text-sm outline-none placeholder:text-[#7a8177] focus:border-[#688763] focus:ring-1 focus:ring-[#688763]"
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
                                    {saving ? (
                                        "Saving..."
                                    ) : (
                                        <>
                                            {editingChild ? "Save changes" : "Add record"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
