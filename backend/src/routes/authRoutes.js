
const express = require("express");
const { login } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);

router.post("/logout", (req, res) => {
    const isProduction = process.env.NODE_ENV === "production";
    const sameSite =
        process.env.COOKIE_SAME_SITE ||
        (isProduction ? "none" : "lax");

    res.clearCookie("aaangan_token", {
        httpOnly: true,
        secure: isProduction || sameSite === "none",
        sameSite,
        path: "/",
    });

    return res.status(200).json({
        message: "Logged out successfully",
    });
});

module.exports = router;
