
const crypto = require("crypto");
const Staff = require("../models/Staff");

async function generateStaffId() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const staffId = `ST-${crypto.randomInt(10000, 100000)}`;
        const existing = await Staff.exists({ staffId });

        if (!existing) return staffId;
    }

    throw new Error("Unable to generate a staff ID. Please try again.");
}

function handleError(res, error, fallback) {
    if (error.name === "ValidationError") {
        return res.status(400).json({
            message: Object.values(error.errors)
                .map((item) => item.message)
                .join(", "),
        });
    }

    if (error.code === 11000) {
        return res.status(409).json({
            message: "A record with this identifier already exists.",
        });
    }

    console.error(fallback, error);
    return res.status(500).json({ message: fallback });
}

exports.getStaff = async (req, res) => {
    try {
        const { search = "", role = "", status = "Active" } = req.query;
        const filter = {};

        if (status !== "all") {
            if (!["Active", "Archived"].includes(status)) {
                return res.status(400).json({ message: "Invalid staff status." });
            }
            filter.status = status;
        }

        if (role && role !== "all") {
            filter.role = role;
        }

        if (search.trim()) {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escaped, "i");

            filter.$or = [
                { fullName: regex },
                { staffId: regex },
                { role: regex },
                { phone: regex },
            ];
        }

        const [staff, totalCount, activeCount, archivedCount] =
            await Promise.all([
                Staff.find(filter).sort({ createdAt: -1 }).lean(),
                Staff.countDocuments(),
                Staff.countDocuments({ status: "Active" }),
                Staff.countDocuments({ status: "Archived" }),
            ]);

        return res.json({
            staff,
            count: staff.length,
            totalCount,
            activeCount,
            archivedCount,
        });
    } catch (error) {
        return handleError(res, error, "Unable to load staff records.");
    }
};

exports.createStaff = async (req, res) => {
    try {
        const { fullName, role, shift, phone, joinedDate, description } = req.body;

        if (
            !fullName?.trim() ||
            !role ||
            !shift ||
            !phone?.trim() ||
            !joinedDate
        ) {
            return res.status(400).json({
                message: "Please complete all required fields.",
            });
        }

        const parsedDate = new Date(joinedDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Invalid joining date." });
        }

        const staff = await Staff.create({
            staffId: await generateStaffId(),
            fullName: fullName.trim(),
            role,
            shift,
            phone: phone.trim(),
            joinedDate: parsedDate,
            description: description || "",
        });

        return res.status(201).json({
            message: "Staff member added successfully.",
            staff,
        });
    } catch (error) {
        return handleError(res, error, "Unable to add staff member.");
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const { fullName, role, shift, phone, joinedDate, description } = req.body;

        if (
            !fullName?.trim() ||
            !role ||
            !shift ||
            !phone?.trim() ||
            !joinedDate
        ) {
            return res.status(400).json({
                message: "Please complete all required fields.",
            });
        }

        const parsedDate = new Date(joinedDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Invalid joining date." });
        }

        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            {
                fullName: fullName.trim(),
                role,
                shift,
                phone: phone.trim(),
                joinedDate: parsedDate,
                description: description || "",
            },
            { new: true, runValidators: true }
        );

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        return res.json({ message: "Staff member updated successfully.", staff });
    } catch (error) {
        return handleError(res, error, "Unable to update staff member.");
    }
};

async function changeStaffStatus(req, res, status) {
    try {
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!staff) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        return res.json({
            message:
                status === "Archived"
                    ? "Staff member archived successfully."
                    : "Staff member restored successfully.",
            staff,
        });
    } catch (error) {
        return handleError(res, error, "Unable to update staff status.");
    }
}

exports.archiveStaff = (req, res) =>
    changeStaffStatus(req, res, "Archived");

exports.restoreStaff = (req, res) =>
    changeStaffStatus(req, res, "Active");
