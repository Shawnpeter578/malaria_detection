require("dotenv").config();
const express = require("express");
const cors = require("cors");


const malariaRoutes = require("./src/routes/malaria"); 

const app = express();
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json()); 
app.use("/uploads", express.static("uploads")); 

// 2. ROUTES
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "ParaScope Node Hub is running cleanly!" });
});

app.use("/api/malaria", malariaRoutes); 

// 3. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Something went wrong", detail: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});