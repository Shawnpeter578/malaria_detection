const express = require("express");
const router = express.Router();
const {
  getAll,
  getOne,
  create,
  update,
  remove,
} = require("../controllers/exampleController");

// GET /api/example        → all items
// GET /api/example/:id    → one item
// POST /api/example       → create item
// PATCH /api/example/:id  → update item
// DELETE /api/example/:id → delete item

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

module.exports = router;
