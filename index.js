require("dotenv").config();
const express = require("express");
const cors = require("cors");

const exampleRoutes = require("./src/routes/example");
const usersRoutes = require("./src/routes/users");
const malariaRoutes = require("./src/routes/malaria"); 

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE: These MUST come before the routes!
app.use(cors());
app.use(express.json()); // <--- This is the magic line that fixes your crash!
app.use("/uploads", express.static("uploads")); // Makes images visible to the dashboard

// 2. ROUTES
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "backend is running" });
});

app.use("/api/example", exampleRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/malaria", malariaRoutes); // Routes can now safely read req.body

// 3. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Something went wrong", detail: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});