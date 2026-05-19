const express = require("express");
const router = express.Router();
const multer = require("multer");

// This tells Multer to temporarily save incoming images into an 'uploads' folder
const upload = multer({ dest: "uploads/" }); 

const { submitSpO2, getAlerts, submitTest, getDashboard } = require("../controllers/malariaController");

router.post("/spo2", submitSpO2);
router.get("/alerts", getAlerts);

// We add upload.single("smearImage") exactly here to catch the file!
router.post("/test", upload.single("smearImage"), submitTest); 
router.get("/dashboard", getDashboard);

module.exports = router;