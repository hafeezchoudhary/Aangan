
const mongoose = require("mongoose");

const childSchema = new mongoose.Schema(
    {
        childId: {
            type: String,
            unique: true,
            index: true,
        },
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            maxlength: 100,
        },
        dateOfBirth: {
            type: Date,
            required: [true, "Date of birth is required"],
        },
        gender: {
            type: String,
            required: true,
            enum: ["Boy", "Girl", "Other"],
        },
        admissionDate: {
            type: Date,
            required: [true, "Admission date is required"],
        },
        guardianName: {
            type: String,
            trim: true,
            default: "",
            maxlength: 150,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
            maxlength: 2000,
        },
        status: {
            type: String,
            enum: ["Active", "Archived"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Child", childSchema);
