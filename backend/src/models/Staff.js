
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        staffId: {
            type: String,
            unique: true,
            index: true,
        },
        fullName: {
            type: String,
            required: [true, "Staff member name is required"],
            trim: true,
            maxlength: 100,
        },
        role: {
            type: String,
            required: [true, "Staff role is required"],
            enum: [
                "Social Worker",
                "Teacher",
                "Housekeeper",
                "Cook",
                "Nurse",
                "Head Caregiver",
                "Administrator",
                "Other",
            ],
        },
        shift: {
            type: String,
            required: [true, "Shift is required"],
            enum: ["Flexible", "Morning", "Afternoon", "Night"],
            default: "Flexible",
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
            match: [/^[+0-9()\-\s]{7,20}$/, "Enter a valid phone number"],
        },
        joinedDate: {
            type: Date,
            required: [true, "Joining date is required"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
        status: {
            type: String,
            enum: ["Active", "Archived"],
            default: "Active",
            index: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
