
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;

        if (!username || !password) {
            throw new Error(
                "Set ADMIN_USERNAME and ADMIN_PASSWORD in .env"
            );
        }

        const existingAdmin = await Admin.findOne({ username });

        if (existingAdmin) {
            console.log("Admin already exists. No changes made.");
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await Admin.create({ username, passwordHash });

        console.log("Initial admin created successfully.");
    } catch (error) {
        console.error("Admin setup failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedAdmin();
