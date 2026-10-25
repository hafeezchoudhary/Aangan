const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
    getDonations,
    createDonation,
    updateDonation,
    deleteDonation,
} = require("../controllers/donationController");

const router = express.Router();

// All donation endpoints require admin authentication.
router.use(authMiddleware);

router.get("/", getDonations);
router.post("/", createDonation);
router.put("/:id", updateDonation);
router.delete("/:id", deleteDonation);

module.exports = router;
