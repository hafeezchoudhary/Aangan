
const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
    getChildren,
    createChild,
    updateChild,
    archiveChild,
    restoreChild,
} = require("../controllers/childController");

const router = express.Router();

// Every children endpoint requires an authenticated admin.
router.use(authMiddleware);

router.get("/", getChildren);
router.post("/", createChild);
router.put("/:id", updateChild);
router.patch("/:id/archive", archiveChild);
router.patch("/:id/restore", restoreChild);

module.exports = router;
