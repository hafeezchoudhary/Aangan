
const crypto = require("crypto");
const mongoose = require("mongoose");
const Donation = require("../models/Donation");

async function generateDonationId() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const donationId = `DN-${crypto.randomInt(1000, 10000)}`;
        const exists = await Donation.exists({ donationId });

        if (!exists) {
            return donationId;
        }
    }

    throw new Error("Unable to generate a unique donation ID. Please try again.");
}

// GET /api/donations
// Retrieve donations, with optional search.
async function getDonations(req, res) {
    try {
        const { search = "" } = req.query;
        const filter = {};

        if (search.trim()) {
            const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(escapedSearch, "i");

            filter.$or = [
                { donationId: regex },
                { donorName: regex },
                { method: regex },
                { note: regex },
            ];
        }

        const donations = await Donation.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .lean();

        const totalAmount = await Donation.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);

        return res.status(200).json({
            donations,
            count: donations.length,
            totalAmount: totalAmount[0]?.total || 0,
        });
    } catch (error) {
        console.error("Get donations error:", error.message);
        return res.status(500).json({ message: "Failed to retrieve donations." });
    }
}

// POST /api/donations
// Create a donation.
async function createDonation(req, res) {
    try {
        const { donorName, date, method, amount, note = "" } = req.body;

        if (!donorName?.trim() || !date || !method || amount === undefined || amount === "") {
            return res.status(400).json({
                message: "Donor name, date, payment method and amount are required.",
            });
        }

        const parsedAmount = Number(amount);
        const parsedDate = new Date(date);

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a number greater than zero.",
            });
        }

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Please provide a valid donation date." });
        }

        const allowedMethods = ["Bank transfer", "UPI", "Cash", "Cheque", "Other"];

        if (!allowedMethods.includes(method)) {
            return res.status(400).json({ message: "Invalid payment method." });
        }

        const donationId = await generateDonationId();

        const donation = await Donation.create({
            donationId,
            donorName: donorName.trim(),
            date: parsedDate,
            method,
            amount: parsedAmount,
            note: typeof note === "string" ? note.trim() : "",
        });

        return res.status(201).json({
            message: "Donation recorded successfully.",
            donation,
        });
    } catch (error) {
        console.error("Create donation error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "A duplicate donation ID was generated. Please try again.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: "Failed to record donation." });
    }
}

// PUT /api/donations/:id
// Update an existing donation.
async function updateDonation(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid donation record ID." });
        }

        const { donorName, date, method, amount, note } = req.body;
        const updates = {};

        if (donorName !== undefined) {
            if (typeof donorName !== "string" || !donorName.trim()) {
                return res.status(400).json({ message: "Donor name cannot be empty." });
            }
            updates.donorName = donorName.trim();
        }

        if (date !== undefined) {
            const parsedDate = new Date(date);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: "Please provide a valid donation date." });
            }

            updates.date = parsedDate;
        }

        if (method !== undefined) {
            const allowedMethods = ["Bank transfer", "UPI", "Cash", "Cheque", "Other"];

            if (!allowedMethods.includes(method)) {
                return res.status(400).json({ message: "Invalid payment method." });
            }

            updates.method = method;
        }

        if (amount !== undefined) {
            const parsedAmount = Number(amount);

            if (amount === "" || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({
                    message: "Amount must be a number greater than zero.",
                });
            }

            updates.amount = parsedAmount;
        }

        if (note !== undefined) {
            if (typeof note !== "string") {
                return res.status(400).json({ message: "Note must be text." });
            }

            updates.note = note.trim();
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid fields were provided to update." });
        }

        const donation = await Donation.findByIdAndUpdate(id, updates, {
            runValidators: true,
            returnDocument: "after",
        });

        if (!donation) {
            return res.status(404).json({ message: "Donation record not found." });
        }

        return res.status(200).json({
            message: "Donation updated successfully.",
            donation,
        });
    } catch (error) {
        console.error("Update donation error:", error.message);

        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: "Failed to update donation." });
    }
}

// DELETE /api/donations/:id
// Permanently delete a donation.
async function deleteDonation(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid donation record ID." });
        }

        const donation = await Donation.findByIdAndDelete(id);

        if (!donation) {
            return res.status(404).json({ message: "Donation record not found." });
        }

        return res.status(200).json({
            message: "Donation deleted successfully.",
            donation,
        });
    } catch (error) {
        console.error("Delete donation error:", error.message);
        return res.status(500).json({ message: "Failed to delete donation." });
    }
}

module.exports = {
    getDonations,
    createDonation,
    updateDonation,
    deleteDonation,
};
