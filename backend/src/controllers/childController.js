
const crypto = require("crypto");
const mongoose = require("mongoose");
const Child = require("../models/Child");

// Generate a unique child ID such as SH-483271.
async function generateChildId() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const number = crypto.randomInt(100000, 1000000);
        const childId = `SH-${number}`;

        const existingChild = await Child.exists({ childId });

        if (!existingChild) {
            return childId;
        }
    }

    throw new Error("Unable to generate a unique child ID");
}

// GET /api/children
// Supports search and status filtering.
async function getChildren(req, res) {
    try {
        const { search = "", status = "all" } = req.query;
        const filter = {};

        if (!["all", "Active", "Archived"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status filter",
            });
        }

        if (status !== "all") {
            filter.status = status;
        }

        const searchTerm = search.trim();

        if (searchTerm) {
            const escapedSearch = searchTerm.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { fullName: { $regex: escapedSearch, $options: "i" } },
                { childId: { $regex: escapedSearch, $options: "i" } },
                { guardianName: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        const children = await Child.find(filter).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            count: children.length,
            children,
        });
    } catch (error) {
        console.error("Get children error:", error.message);

        return res.status(500).json({
            message: "Failed to retrieve children",
        });
    }
}

// POST /api/children
async function createChild(req, res) {
    try {
        const {
            fullName,
            dateOfBirth,
            gender,
            admissionDate,
            guardianName,
            notes,
        } = req.body;

        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            !dateOfBirth ||
            !gender ||
            !admissionDate
        ) {
            return res.status(400).json({
                message:
                    "Full name, date of birth, gender, and admission date are required",
            });
        }

        if (!["Boy", "Girl", "Other"].includes(gender)) {
            return res.status(400).json({
                message: "Invalid gender value",
            });
        }

        const dob = new Date(dateOfBirth);
        const admitted = new Date(admissionDate);

        if (
            Number.isNaN(dob.getTime()) ||
            Number.isNaN(admitted.getTime())
        ) {
            return res.status(400).json({
                message: "Please provide valid dates",
            });
        }

        if (dob > new Date()) {
            return res.status(400).json({
                message: "Date of birth cannot be in the future",
            });
        }

        if (admitted < dob) {
            return res.status(400).json({
                message: "Admission date cannot be before date of birth",
            });
        }

        if (admitted > new Date()) {
            return res.status(400).json({
                message: "Admission date cannot be in the future",
            });
        }

        if (
            guardianName !== undefined &&
            typeof guardianName !== "string"
        ) {
            return res.status(400).json({
                message: "Guardian contact must be text",
            });
        }

        if (notes !== undefined && typeof notes !== "string") {
            return res.status(400).json({
                message: "Notes must be text",
            });
        }

        const childId = await generateChildId();

        const child = await Child.create({
            childId,
            fullName: fullName.trim(),
            dateOfBirth: dob,
            gender,
            admissionDate: admitted,
            guardianName: (guardianName || "").trim(),
            notes: (notes || "").trim(),
            status: "Active",
        });

        return res.status(201).json({
            message: "Child record created successfully",
            child,
        });
    } catch (error) {
        console.error("Create child error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "A record with this ID already exists. Please try again.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to create child record",
        });
    }
}

// PUT /api/children/:id
async function updateChild(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid child record ID",
            });
        }

        const {
            fullName,
            dateOfBirth,
            gender,
            admissionDate,
            guardianName,
            notes,
        } = req.body;

        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            !dateOfBirth ||
            !gender ||
            !admissionDate
        ) {
            return res.status(400).json({
                message:
                    "Full name, date of birth, gender, and admission date are required",
            });
        }

        if (!["Boy", "Girl", "Other"].includes(gender)) {
            return res.status(400).json({
                message: "Invalid gender value",
            });
        }

        const dob = new Date(dateOfBirth);
        const admitted = new Date(admissionDate);

        if (
            Number.isNaN(dob.getTime()) ||
            Number.isNaN(admitted.getTime())
        ) {
            return res.status(400).json({
                message: "Please provide valid dates",
            });
        }

        if (dob > new Date()) {
            return res.status(400).json({
                message: "Date of birth cannot be in the future",
            });
        }

        if (admitted < dob || admitted > new Date()) {
            return res.status(400).json({
                message: "Please provide a valid admission date",
            });
        }

        if (
            guardianName !== undefined &&
            typeof guardianName !== "string"
        ) {
            return res.status(400).json({
                message: "Guardian contact must be text",
            });
        }

        if (notes !== undefined && typeof notes !== "string") {
            return res.status(400).json({
                message: "Notes must be text",
            });
        }

        const child = await Child.findByIdAndUpdate(
            id,
            {
                $set: {
                    fullName: fullName.trim(),
                    dateOfBirth: dob,
                    gender,
                    admissionDate: admitted,
                    guardianName: (guardianName || "").trim(),
                    notes: (notes || "").trim(),
                },
            },
            {
                returnDocument: "after",
                runValidators: true,
            }
        );

        if (!child) {
            return res.status(404).json({
                message: "Child record not found",
            });
        }

        return res.status(200).json({
            message: "Child record updated successfully",
            child,
        });
    } catch (error) {
        console.error("Update child error:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message,
            });
        }

        return res.status(500).json({
            message: "Failed to update child record",
        });
    }
}

// PATCH /api/children/:id/archive
async function archiveChild(req, res) {
    return changeChildStatus(req, res, "Archived");
}

// PATCH /api/children/:id/restore
async function restoreChild(req, res) {
    return changeChildStatus(req, res, "Active");
}

async function changeChildStatus(req, res, status) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid child record ID",
            });
        }

        const child = await Child.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true, runValidators: true }
        );

        if (!child) {
            return res.status(404).json({
                message: "Child record not found",
            });
        }

        return res.status(200).json({
            message:
                status === "Archived"
                    ? "Child record archived successfully"
                    : "Child record restored successfully",
            child,
        });
    } catch (error) {
        console.error("Change child status error:", error.message);

        return res.status(500).json({
            message: "Failed to change child record status",
        });
    }
}

module.exports = {
    getChildren,
    createChild,
    updateChild,
    archiveChild,
    restoreChild,
};
