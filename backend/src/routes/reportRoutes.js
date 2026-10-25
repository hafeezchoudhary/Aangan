
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getReportSummary } = require("../controllers/reportController");

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", getReportSummary);

module.exports = router;
