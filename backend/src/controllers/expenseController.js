
const crypto = require("crypto");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");

const ALLOWED_CATEGORIES = [
    "Food",
    "Education",
    "Healthcare",
    "Clothing",
    "Utilities",
    "Maintenance",
    "Transportation",
    "Other",
];

const ALLOWED_PAYMENT_METHODS = [
    "Cash",
    "UPI",
    "Bank transfer",
    "Cheque",
    "Other",
];

function isValidDate(value) {
    return value && !Number.isNaN(new Date(value).getTime());
}

async function generateExpenseId() {
    for (let attempt = 0; attempt < 10; attempt++) {
        const expenseId = `EX-${crypto.randomInt(1000, 10000)}`;
        const exists = await Expense.exists({ expenseId });

        if (!exists) {
            return expenseId;
        }
    }

    throw new Error("Unable to generate a unique expense ID. Please try again.");
}

// GET /api/expenses
async function getExpenses(req, res) {
    try {
        const search = (req.query.search || "").trim();
        const filter = {};

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchRegex = new RegExp(escapedSearch, "i");

            filter.$or = [
                { expenseId: searchRegex },
                { title: searchRegex },
                { category: searchRegex },
                { paymentMethod: searchRegex },
                { note: searchRegex },
            ];
        }

        const [expenses, count, totals] = await Promise.all([
            Expense.find(filter).sort({ date: -1, createdAt: -1 }),
            Expense.countDocuments(filter),
            Expense.aggregate([
                { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
            ]),
        ]);

        res.json({
            expenses,
            count,
            totalAmount: totals[0]?.totalAmount || 0,
        });
    } catch (error) {
        console.error("Get expenses error:", error);
        res.status(500).json({ message: "Failed to fetch expenses." });
    }
}

// POST /api/expenses
async function createExpense(req, res) {
    try {
        const {
            title,
            category,
            date,
            amount,
            paymentMethod = "Other",
            note = "",
        } = req.body;

        if (!title?.trim() || !category || !date || amount === undefined || amount === "") {
            return res.status(400).json({
                message: "Title, category, date, and amount are required.",
            });
        }

        if (!ALLOWED_CATEGORIES.includes(category)) {
            return res.status(400).json({ message: "Invalid expense category." });
        }

        if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method." });
        }

        if (!isValidDate(date)) {
            return res.status(400).json({ message: "Please provide a valid date." });
        }

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                message: "Amount must be a number greater than zero.",
            });
        }

        const expenseId = await generateExpenseId();

        const expense = await Expense.create({
            expenseId,
            title: title.trim(),
            category,
            date: new Date(date),
            amount: numericAmount,
            paymentMethod,
            note,
        });

        return res.status(201).json({
            message: "Expense created successfully.",
            expense,
        });
    } catch (error) {
        console.error("Create expense error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "An expense with this ID already exists. Please try again.",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: "Failed to create expense." });
    }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid expense ID." });
        }

        const { title, category, date, amount, paymentMethod, note } = req.body;
        const updates = {};

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({ message: "Title cannot be empty." });
            }
            updates.title = title.trim();
        }

        if (category !== undefined) {
            if (!ALLOWED_CATEGORIES.includes(category)) {
                return res.status(400).json({ message: "Invalid expense category." });
            }
            updates.category = category;
        }

        if (date !== undefined) {
            if (!isValidDate(date)) {
                return res.status(400).json({ message: "Please provide a valid date." });
            }
            updates.date = new Date(date);
        }

        if (amount !== undefined) {
            const numericAmount = Number(amount);

            if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({
                    message: "Amount must be a number greater than zero.",
                });
            }

            updates.amount = numericAmount;
        }

        if (paymentMethod !== undefined) {
            if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
                return res.status(400).json({ message: "Invalid payment method." });
            }
            updates.paymentMethod = paymentMethod;
        }

        if (note !== undefined) {
            updates.note = note;
        }

        const expense = await Expense.findByIdAndUpdate(id, updates, {
            runValidators: true,
            returnDocument: "after",
        });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found." });
        }

        return res.json({
            message: "Expense updated successfully.",
            expense,
        });
    } catch (error) {
        console.error("Update expense error:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: "Failed to update expense." });
    }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid expense ID." });
        }

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found." });
        }

        return res.json({ message: "Expense deleted successfully." });
    } catch (error) {
        console.error("Delete expense error:", error);
        return res.status(500).json({ message: "Failed to delete expense." });
    }
}

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
};
