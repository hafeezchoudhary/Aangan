
const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
    {
        donationId: {
            type: String,
            unique: true,
            index: true,
        },
        donorName: {
            type: String,
            required: [true, "Donor name is required"],
            trim: true,
            maxlength: 150,
        },
        date: {
            type: Date,
            required: [true, "Donation date is required"],
            default: Date.now,
        },
        method: {
            type: String,
            required: [true, "Payment method is required"],
            enum: ["Bank transfer", "UPI", "Cash", "Cheque", "Other"],
        },
        amount: {
            type: Number,
            required: [true, "Donation amount is required"],
            min: [0.01, "Donation amount must be greater than zero"],
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

module.exports = mongoose.model("Donation", donationSchema);
