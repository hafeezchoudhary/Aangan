
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const donationRoutes = require("./routes/donationRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

const allowedOrigin =
    process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
    cors({
        origin: allowedOrigin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API status
app.get("/", (req, res) => {
    res.json({ message: "Aaangan API is running" });
});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Aaangan API" });
});

// Authentication
app.use("/api/auth", authRoutes);

// Protected modules
app.use("/api/children", childRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/expenses", expenseRoutes);

// Protected authentication test
app.get("/api/auth/protected", authMiddleware, (req, res) => {
    res.json({
        message: "Welcome to the protected Aaangan admin area",
        adminId: req.admin.sub,
    });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
