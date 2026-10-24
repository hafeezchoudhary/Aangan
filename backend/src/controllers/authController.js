
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Username and password are required",
            });
        }

        const admin = await Admin.findOne({
            username: username.trim(),
        });

        if (!admin) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            admin.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from .env");
        }

        const token = jwt.sign(
            { sub: admin._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const isProduction = process.env.NODE_ENV === "production";
        const sameSite =
            process.env.COOKIE_SAME_SITE ||
            (isProduction ? "none" : "lax");

        res.cookie("aaangan_token", token, {
            httpOnly: true,
            secure: isProduction || sameSite === "none",
            sameSite,
            maxAge: 60 * 60 * 1000,
            path: "/",
        });

        return res.status(200).json({
            message: "Login successful",
            admin: {
                id: admin._id,
                username: admin.username,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

module.exports = { login };
