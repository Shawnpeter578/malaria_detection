const express = require("express");
const router = express.Router();
const { getAll, register, remove } = require("../controllers/usersController");

router.get("/", getAll);
router.post("/register", register);
router.delete("/:id", remove);

module.exports = router;  