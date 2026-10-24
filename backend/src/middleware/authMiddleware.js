
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const token = req.cookies?.aaangan_token;

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Please log in.",
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is missing from .env");

        return res.status(500).json({
            message: "Server configuration error",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.sub) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}

module.exports = authMiddleware;
