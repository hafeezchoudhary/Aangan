
import { useCallback, useEffect, useState } from "react";
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiArchive,
    FiRotateCcw,
    FiX,
    FiUsers,
    FiPhone,
    FiCalendar,
    FiRefreshCw,
    FiAlertCircle,
    FiCheckCircle,
} from "react-icons/fi";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const ROLES = [
    "Social Worker",
    "Teacher",
    "Housekeeper",
    "Cook",
    "Nurse",
    "Head Caregiver",
    "Administrator",
    "Other",
];

const SHIFTS = ["Flexible", "Morning", "Afternoon", "Night"];

const EMPTY_FORM = {
    fullName: "",
    role: "Social Worker",
    shift: "Flexible",
    phone: "",
    joinedDate: new Date().toLocaleDateString("en-CA"),
    description: "",
};

const buttonStyle = {
    backgroundColor: "var(--color-brand)",
    color: "var(--color-on-dark)",
};

const softBorder = {
    borderColor: "var(--color-border)",
};

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

function dateForInput(value) {
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
        throw new Error(data.message || "The request could not be completed.");
    }

    return data;
}

function Field({ label, htmlFor, children }) {
    return (
        <div className="min-w-0">
            <label
                htmlFor={htmlFor}
                className="mb-1.5 block text-sm font-medium text-heading"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-heading)",
};

export default function Staff() {
    const [staff, setStaff] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [view, setView] = useState("Active");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });

    const [counts, setCounts] = useState({
        totalCount: 0,
        activeCount: 0,
        archivedCount: 0,
    });

    const archivedView = view === "Archived";

    const loadStaff = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({ status: view });

            if (search.trim()) {
                params.set("search", search.trim());
            }

            if (roleFilter !== "all") {
                params.set("role", roleFilter);
            }

            const response = await fetch(
                `${API_URL}/api/staff?${params.toString()}`,
                { credentials: "include" }
            );

            const data = await readResponse(response);

            setStaff(Array.isArray(data.staff) ? data.staff : []);
            setCounts({
                totalCount: data.totalCount ?? 0,
                activeCount: data.activeCount ?? 0,
                archivedCount: data.archivedCount ?? 0,
            });
        } catch (err) {
            setStaff([]);
            setError(
                err.message ||
                "Unable to load staff. Check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    }, [view, search, roleFilter]);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    useEffect(() => {
        if (!notice) return undefined;

        const timeout = window.setTimeout(() => setNotice(""), 3500);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    function openAddModal() {
        setEditingStaff(null);
        setForm({ ...EMPTY_FORM });
        setError("");
        setModalOpen(true);
    }

    function openEditModal(member) {
        setEditingStaff(member);
        setForm({
            fullName: member.fullName || "",
            role: member.role || "Other",
            shift: member.shift || "Flexible",
            phone: member.phone || "",
            joinedDate: dateForInput(member.joinedDate),
            description: member.description || "",
        });
        setError("");
        setModalOpen(true);
    }

    function closeModal() {
        if (saving) return;

        setModalOpen(false);
        setEditingStaff(null);
        setForm({ ...EMPTY_FORM });
        setError("");
    }

    function updateField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (
            !form.fullName.trim() ||
            !form.role ||
            !form.shift ||
            !form.phone.trim() ||
            !form.joinedDate
        ) {
            setError("Please complete all required fields.");
            return;
        }

        setSaving(true);

        try {
            const editing = Boolean(editingStaff);
            const url = editing
                ? `${API_URL}/api/staff/${editingStaff._id}`
                : `${API_URL}/api/staff`;

            const response = await fetch(url, {
                method: editing ? "PUT" : "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: form.fullName.trim(),
                    role: form.role,
                    shift: form.shift,
                    phone: form.phone.trim(),
                    joinedDate: form.joinedDate,
                    description: form.description.trim(),
                }),
            });

            const data = await readResponse(response);

            setModalOpen(false);
            setEditingStaff(null);
            setForm({ ...EMPTY_FORM });
            setNotice(data.message || "Staff record saved successfully.");

            await loadStaff();
        } catch (err) {
            setError(err.message || "Unable to save staff record.");
        } finally {
            setSaving(false);
        }
    }

    async function changeStatus(member) {
        const isActive = member.status === "Active";
        const action = isActive ? "archive" : "restore";

        const confirmation = isActive
            ? `Archive ${member.fullName}? You can restore this record later.`
            : `Restore ${member.fullName} to the active staff list?`;

        if (!window.confirm(confirmation)) return;

        setUpdatingId(member._id);
        setError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_URL}/api/staff/${member._id}/${action}`,
                {
                    method: "PATCH",
                    credentials: "include",
                }
            );

            const data = await readResponse(response);

            setNotice(data.message || "Staff status updated.");
            await loadStaff();
        } catch (err) {
            setError(err.message || "Unable to update staff status.");
        } finally {
            setUpdatingId("");
        }
    }

    function changeView() {
        setView(archivedView ? "Active" : "Archived");
        setSearch("");
        setRoleFilter("all");
        setError("");
        setNotice("");
    }

    return (
        <main className="min-h-screen min-w-0 bg-page px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pt-10 xl:px-10">
            <div className="mx-auto w-full max-w-375">
                {/* Page heading and actions */}
                <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand">
                            Our team
                        </p>

                        <h1 className="font-serif text-4xl leading-tight tracking-tight text-heading sm:text-5xl">
                            {archivedView ? "Archived Staff" : "Staff"}
                        </h1>

                        <p className="mt-2 text-sm text-body sm:text-base">
                            {archivedView
                                ? `${counts.archivedCount} archived team member${counts.archivedCount === 1 ? "" : "s"}`
                                : `${counts.totalCount} team member${counts.totalCount === 1 ? "" : "s"} · ${counts.activeCount} active`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={changeView}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-surface px-4 py-2.5 text-sm font-medium text-heading transition hover:bg-brand-soft"
                            style={softBorder}
                        >
                            {archivedView ? (
                                <FiUsers size={17} />
                            ) : (
                                <FiArchive size={17} />
                            )}
                            {archivedView ? "Active staff" : "Archived staff"}
                        </button>

                        <button
                            type="button"
                            onClick={loadStaff}
                            disabled={loading}
                            aria-label="Refresh staff list"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-surface px-4 py-2.5 text-sm font-medium text-heading transition hover:bg-brand-soft disabled:opacity-60"
                            style={softBorder}
                        >
                            <FiRefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        {!archivedView && (
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:brightness-90 sm:px-5"
                                style={buttonStyle}
                            >
                                <FiPlus size={19} />
                                Add team member
                            </button>
                        )}
                    </div>
                </header>

                {/* Success notification */}
                {notice && (
                    <div
                        role="status"
                        className="mb-5 flex items-start gap-2 rounded-lg border border-[#c8dfc9] bg-[#edf6ed] px-4 py-3 text-sm text-[#285c35]"
                    >
                        <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
                        <span>{notice}</span>
                    </div>
                )}

                {/* Error notification */}
                {error && !modalOpen && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                    >
                        <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
                        <p className="min-w-0 flex-1 wrap-break-word">{error}</p>
                        <button
                            type="button"
                            onClick={loadStaff}
                            className="shrink-0 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Search and role filter */}
                <section
                    aria-label="Search and filter staff"
                    className="mb-5 grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_220px]"
                >
                    <label className="relative block min-w-0">
                        <span className="sr-only">Search staff</span>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, role or phone..."
                            className="block min-h-14 w-full appearance-none rounded-xl border bg-surface py-3 pl-12 pr-4 text-sm leading-5 text-heading outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
                            style={softBorder}
                        />
                    </label>

                    <label className="block min-w-0">
                        <span className="sr-only">Filter by role</span>
                        <select
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value)}
                            className="min-h-11 w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-heading outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                            style={softBorder}
                        >
                            <option value="all">All roles</option>
                            {ROLES.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </label>
                </section>

                {/* Staff records */}
                <section
                    aria-label="Staff records"
                    className="overflow-hidden rounded-xl border bg-surface shadow-sm"
                    style={softBorder}
                >
                    <div className="flex items-center justify-between gap-3 border-b border-[#e8e7df] px-4 py-4 sm:px-5">
                        <h2 className="text-sm font-semibold text-heading sm:text-base">
                            {archivedView ? "Archived team members" : "Team members"}
                        </h2>
                        <span className="shrink-0 text-xs text-muted">
                            {loading ? "Loading..." : `${staff.length} shown`}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center text-sm text-body">
                            <FiRefreshCw className="animate-spin text-brand" size={24} />
                            Loading staff records...
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center sm:min-h-80">
                            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                                <FiUsers size={26} />
                            </span>

                            <h3 className="text-lg font-semibold text-heading sm:text-xl">
                                {archivedView
                                    ? "No archived staff"
                                    : search || roleFilter !== "all"
                                        ? "No matching staff members"
                                        : "No staff members found"}
                            </h3>

                            <p className="mt-2 max-w-md text-sm leading-6 text-body">
                                {search || roleFilter !== "all"
                                    ? "Try changing your search or selecting a different role."
                                    : archivedView
                                        ? "Archived staff records will appear here. You can restore them whenever needed."
                                        : "Add your first team member to start managing your staff records."}
                            </p>

                            {!archivedView && !search && roleFilter === "all" && (
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:brightness-90"
                                    style={buttonStyle}
                                >
                                    <FiPlus size={18} />
                                    Add team member
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto lg:block">
                                <table className="w-full min-w-250 border-collapse text-left">
                                        <thead className="bg-[#f3f2eb] text-xs font-semibold text-body">
                                        <tr>
                                            <th className="px-5 py-4">Team member</th>
                                            <th className="px-4 py-4">Role</th>
                                            <th className="px-4 py-4">Shift</th>
                                            <th className="px-4 py-4">Phone</th>
                                            <th className="px-4 py-4">Joined</th>
                                            <th className="px-4 py-4">Status</th>
                                            <th className="px-5 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>

                                            <tbody className="divide-y divide-[#e8e5dc]">
                                        {staff.map((member) => (
                                            <tr
                                                key={member._id}
                                                className="transition-colors hover:bg-page/70"
                                            >
                                                <td className="max-w-75 px-5 py-4">
                                                    <p className="wrap-break-word font-medium text-heading">
                                                        {member.fullName}
                                                    </p>
                                                    <p className="mt-1 wrap-break-word text-xs leading-5 text-body">
                                                        {member.staffId}
                                                        {member.description
                                                            ? ` · ${member.description}`
                                                            : ""}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span className="inline-block max-w-40 rounded-md bg-[#f0eddf] px-3 py-1.5 text-xs font-medium text-[#30392c]">
                                                        {member.role}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-sm text-heading">
                                                    {member.shift}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-heading">
                                                    {member.phone}
                                                </td>

                                                <td className="whitespace-nowrap px-4 py-4 text-sm text-heading">
                                                    {formatDate(member.joinedDate)}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex rounded-md px-3 py-1.5 text-xs font-semibold ${member.status === "Active"
                                                                ? "bg-brand text-on-dark"
                                                                : "bg-[#ece9e1] text-[#68685d]"
                                                            }`}
                                                    >
                                                        {member.status}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {!archivedView && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(member)}
                                                                className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-heading transition hover:bg-brand-soft hover:text-brand"
                                                                aria-label={`Edit ${member.fullName}`}
                                                            >
                                                                <FiEdit2 size={16} />
                                                                Edit
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            disabled={updatingId === member._id}
                                                            onClick={() => changeStatus(member)}
                                                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-heading transition hover:bg-brand-soft hover:text-brand disabled:opacity-50"
                                                            aria-label={
                                                                archivedView
                                                                    ? `Restore ${member.fullName}`
                                                                    : `Archive ${member.fullName}`
                                                            }
                                                        >
                                                            {archivedView ? (
                                                                <FiRotateCcw size={16} />
                                                            ) : (
                                                                <FiArchive size={16} />
                                                            )}
                                                            {updatingId === member._id
                                                                ? "Saving..."
                                                                : archivedView
                                                                    ? "Restore"
                                                                    : "Archive"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Tablet and mobile cards */}
                            {/* <div className="divide-y divide-border lg:hidden">
                                {staff.map((member) => (
                                    <article
                                        key={member._id}
                                        className="space-y-4 p-4 transition hover:bg-page/60 sm:p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="wrap-break-word font-semibold text-heading">
                                                    {member.fullName}
                                                </h3>
                                                <p className="mt-1 text-xs text-body">
                                                    {member.staffId}
                                                </p>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold ${member.status === "Active"
                                                        ? "bg-brand text-on-dark"
                                                        : "bg-[#ece9e1] text-[#68685d]"
                                                    }`}
                                            >
                                                {member.status}
                                            </span>
                                        </div>

                                        {member.description && (
                                            <p className="wrap-break-word text-sm leading-5 text-body">
                                                {member.description}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-md bg-[#f0eddf] px-3 py-1.5 text-xs font-medium text-[#30392c]">
                                                {member.role}
                                            </span>
                                            <span className="rounded-md bg-page px-3 py-1.5 text-xs text-heading">
                                                {member.shift} shift
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 text-sm text-body sm:grid-cols-2">
                                            <p className="flex min-w-0 items-center gap-2">
                                                <FiPhone className="shrink-0" size={15} />
                                                <span className="break-all">{member.phone}</span>
                                            </p>

                                            <p className="flex items-center gap-2">
                                                <FiCalendar className="shrink-0" size={15} />
                                                <span>Joined {formatDate(member.joinedDate)}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                                            {!archivedView && (
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(member)}
                                                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm font-medium text-heading transition hover:bg-brand-soft"
                                                    style={softBorder}
                                                >
                                                    <FiEdit2 size={15} />
                                                    Edit
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={updatingId === member._id}
                                                onClick={() => changeStatus(member)}
                                                className="inline-flex min-h-10 items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-sm font-medium text-heading transition hover:bg-brand-soft disabled:opacity-50"
                                                style={softBorder}
                                            >
                                                {archivedView ? (
                                                    <FiRotateCcw size={15} />
                                                ) : (
                                                    <FiArchive size={15} />
                                                )}
                                                {updatingId === member._id
                                                    ? "Saving..."
                                                    : archivedView
                                                        ? "Restore"
                                                        : "Archive"}
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div> */}
                        </>
                    )}
                </section>
            </div>

            {/* Add / edit modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-70 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="staff-modal-title"
                        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-page shadow-2xl sm:rounded-2xl"
                    >
                        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-page px-5 py-4 sm:px-7">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-brand">
                                    Team management
                                </p>

                                <h2
                                    id="staff-modal-title"
                                    className="mt-1 font-serif text-2xl text-heading"
                                >
                                    {editingStaff ? "Edit team member" : "Add team member"}
                                </h2>

                                {editingStaff && (
                                    <p className="mt-1 text-xs text-body">
                                        Staff ID: {editingStaff.staffId}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close form"
                                className="rounded-lg p-2 text-body transition hover:bg-brand-soft disabled:opacity-50">
                                <FiX size={21} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
                            {error && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800"
                                >
                                    <FiAlertCircle className="mt-0.5 shrink-0" size={17} />
                                    <span className="wrap-break-word">{error}</span>
                                </div>
                            )}

                            <Field label="Full name *" htmlFor="staff-fullName">
                                <input
                                    id="staff-fullName"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={updateField}
                                    required
                                    maxLength={100}
                                    autoComplete="name"
                                    placeholder="Enter full name"
                                    className="min-h-11 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
                                    style={inputStyle}/>
                            </Field>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Role *" htmlFor="staff-role">
                                    <select
                                        id="staff-role"
                                        name="role"
                                        value={form.role}
                                        onChange={updateField}
                                        required
                                        className="min-h-11 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                                        style={inputStyle}
                                    >
                                        {ROLES.map((role) => (
                                            <option key={role} value={role}>
                                                {role}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Shift *" htmlFor="staff-shift">
                                    <select
                                        id="staff-shift"
                                        name="shift"
                                        value={form.shift}
                                        onChange={updateField}
                                        required
                                        className="min-h-11 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                                        style={inputStyle}
                                    >
                                        {SHIFTS.map((shift) => (
                                            <option key={shift} value={shift}>
                                                {shift}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Phone number *" htmlFor="staff-phone">
                                    <input
                                        id="staff-phone"
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={updateField}
                                        required
                                        minLength={7}
                                        maxLength={20}
                                        autoComplete="tel"
                                        placeholder="Enter phone number"
                                        className="min-h-11 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                                        style={inputStyle}
                                    />
                                </Field>

                                <Field label="Joining date *" htmlFor="staff-joinedDate">
                                    <input
                                        id="staff-joinedDate"
                                        name="joinedDate"
                                        type="date"
                                        value={form.joinedDate}
                                        onChange={updateField}
                                        required
                                        max={new Date().toLocaleDateString("en-CA")}
                                        className="min-h-11 w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                                        style={inputStyle}
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Responsibilities / notes"
                                htmlFor="staff-description"
                            >
                                <textarea
                                    id="staff-description"
                                    name="description"
                                    value={form.description}
                                    onChange={updateField}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Briefly describe this team member's responsibilities..."
                                    className="w-full resize-y rounded-lg border px-3.5 py-3 text-sm outline-none focus:border-brand"
                                    style={inputStyle}
                                />
                                <p className="mt-1 text-right text-xs text-muted">
                                    {form.description.length}/500
                                </p>
                            </Field>

                            <footer className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="min-h-11 rounded-lg border bg-surface px-5 py-2.5 text-sm font-medium text-heading transition hover:bg-brand-soft disabled:opacity-50"
                                    style={softBorder}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    style={buttonStyle}
                                >
                                    {saving && (
                                        <FiRefreshCw className="animate-spin" size={16} />
                                    )}
                                    {saving
                                        ? "Saving..."
                                        : editingStaff
                                            ? "Save changes"
                                            : "Add team member"}
                                </button>
                            </footer>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}
