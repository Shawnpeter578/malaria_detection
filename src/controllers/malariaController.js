const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const dbPath = path.join(__dirname, "../../malaria.db");
const db = new sqlite3.Database(dbPath);

// SCHEMA UPDATED FOR MEDICAL PASSPORT
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE,
    name TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    temperature REAL,
    spo2_reading INTEGER,
    symptoms TEXT,
    result TEXT,
    confidence INTEGER,
    reasoning TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

const dbRun = (query, params) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) { if (err) reject(err); else resolve(this); });
});

const dbAll = (query, params) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
});

// 1. LOOKUP PATIENT (The Passport Fetcher)
const lookupPatient = async (req, res) => {
  try {
    const phone = req.params.phone;
    const patients = await dbAll(`SELECT * FROM patients WHERE phone = ?`, [phone]);
    
    if (patients.length === 0) return res.json({ found: false });

    const patient = patients[0];
    const visits = await dbAll(`SELECT * FROM visits WHERE patient_id = ? ORDER BY created_at DESC`, [patient.id]);
    
    res.json({ found: true, patient, history: visits });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// 2. ONE-SHOT SUBMIT (Handles Demographics, Vitals, and AI all at once)
const submitVisit = async (req, res) => {
  const { name, phone, location, temperature, spo2_reading, symptoms } = req.body;
  const imageFile = req.file; 

  if (!phone || !imageFile) return res.status(400).json({ error: "Phone and image required" });

  try {
    // --- PASSPORT LOGIC: Find or Create Patient ---
    let patient_id;
    const existing = await dbAll(`SELECT id FROM patients WHERE phone = ?`, [phone]);
    
    if (existing.length > 0) {
      patient_id = existing[0].id; // Returning patient
    } else {
      patient_id = crypto.randomUUID(); // New patient
      await dbRun(`INSERT INTO patients (id, phone, name, location) VALUES (?, ?, ?, ?)`, [patient_id, phone, name, location]);
    }

    // --- AI INFERENCE ---
    const image_url = `/uploads/${imageFile.filename}`;
    const pyFormData = new FormData();
    pyFormData.append("image", fs.createReadStream(imageFile.path));

    const aiResponse = await axios.post("http://127.0.0.1:5000/predict", pyFormData, { headers: pyFormData.getHeaders() });
    
    let { result, confidence } = aiResponse.data;
    let reasoning = "Image-based AI Inference";

    // --- CLINICAL ENGINE ---
    if (result === "negative") {
      let riskScore = 0;
      const t = Number(temperature); const o2 = Number(spo2_reading); const symp = symptoms || "";
      if (t > 100.5) riskScore += 2;
      if (o2 < 94) riskScore += 3;
      if (symp.includes("Fever")) riskScore += 3;
      if (symp.includes("Chills")) riskScore += 2;

      if (riskScore >= 5) {
        result = "Presumptive Positive";
        confidence = 85; 
        reasoning = `Clinical Override (Risk Score: ${riskScore}/10)`;
      }
    }

    // --- SAVE THE VISIT RECORD ---
    const visit_id = crypto.randomUUID();
    await dbRun(
      `INSERT INTO visits (id, patient_id, temperature, spo2_reading, symptoms, result, confidence, reasoning, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [visit_id, patient_id, temperature, spo2_reading, symptoms, result, confidence, reasoning, image_url]
    );

    // Fetch full history to send back to ASHA screen
    const fullHistory = await dbAll(`SELECT * FROM visits WHERE patient_id = ? ORDER BY created_at DESC`, [patient_id]);
    res.status(201).json({ result, confidence, reasoning, history: fullHistory });

  } catch (error) { res.status(500).json({ error: "Server Error: " + error.message }); }
};

const getDashboard = async (req, res) => {
  try {
    // 1. Fetch all patients and all visits independently
    const patients = await dbAll(`SELECT * FROM patients ORDER BY created_at DESC`);
    const visits = await dbAll(`SELECT * FROM visits ORDER BY created_at DESC`);
    
    // 2. Calculate KPIs
    const positive = visits.filter(v => v.result.toLowerCase().includes("positive")).length;
    const rate = visits.length > 0 ? ((positive / visits.length) * 100).toFixed(1) : 0;

    // 3. Send the raw data arrays directly to the frontend for client-side rendering
    res.json({ 
      total_patients: patients.length, 
      total_tests: visits.length, 
      positive_cases: positive, 
      positivity_rate: `${rate}%`, 
      patients: patients, // The frontend will use this to build the cards
      visits: visits      // The frontend will nest these inside the cards
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
module.exports = { lookupPatient, submitVisit, getDashboard };