const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ dest: "uploads/" }); 

// Import the updated controller functions
const { lookupPatient, submitVisit, getDashboard } = require("../controllers/malariaController");

// New route to fetch patient history by phone number
router.get("/patient/:phone", lookupPatient);

// One single route handles both the text data and the image at the same time
router.post("/visit", upload.single("smearImage"), submitVisit); 

router.get("/dashboard", getDashboard);

module.exports = router;