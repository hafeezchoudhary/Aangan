
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    getStaff,
    createStaff,
    updateStaff,
    archiveStaff,
    restoreStaff,
} = require("../controllers/staffController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", getStaff);
router.post("/", createStaff);
router.put("/:id", updateStaff);
router.patch("/:id/archive", archiveStaff);
router.patch("/:id/restore", restoreStaff);

module.exports = router;
