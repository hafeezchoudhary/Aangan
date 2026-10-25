
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        expenseId: {
            type: String,
            unique: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, "Expense title is required"],
            trim: true,
            maxlength: 150,
        },
        category: {
            type: String,
            required: [true, "Expense category is required"],
            enum: [
                "Food",
                "Education",
                "Healthcare",
                "Clothing",
                "Utilities",
                "Maintenance",
                "Transportation",
                "Other",
            ],
        },
        date: {
            type: Date,
            required: [true, "Expense date is required"],
            default: Date.now,
        },
        amount: {
            type: Number,
            required: [true, "Expense amount is required"],
            min: [0.01, "Expense amount must be greater than zero"],
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Bank transfer", "Cheque", "Other"],
            default: "Other",
        },
        note: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Expense", expenseSchema);
