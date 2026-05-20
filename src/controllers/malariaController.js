const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const dbPath = path.join(__dirname, "../../malaria.db");
const db = new sqlite3.Database(dbPath);

// SCHEMA DEFINITION
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

// 1. LOOKUP PATIENT
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

// 2. SUBMIT VISIT - The Fail-Safe Override Engine
const submitVisit = async (req, res) => {
  const { name, phone, location, temperature, spo2_reading, symptoms } = req.body;
  const imageFile = req.file; 

  if (!phone || !imageFile) {
    return res.status(400).json({ error: "Phone number and slide image are required." });
  }

  try {
    // --- PASSPORT LOGIC ---
    let patient_id;
    const existing = await dbAll(`SELECT id FROM patients WHERE phone = ?`, [phone]);
    
    if (existing.length > 0) {
      patient_id = existing[0].id;
    } else {
      patient_id = crypto.randomUUID();
      await dbRun(`INSERT INTO patients (id, phone, name, location) VALUES (?, ?, ?, ?)`, [patient_id, phone, name, location]);
    }

    // --- TIER 1: AI INFERENCE ENGINE ---
    const image_url = `/uploads/${imageFile.filename}`;
    const pyFormData = new FormData();
    pyFormData.append("image", fs.createReadStream(imageFile.path));

    const aiResponse = await axios.post("http://127.0.0.1:5000/predict", pyFormData, { headers: pyFormData.getHeaders() });
    
    let { result, confidence } = aiResponse.data;
    let reasoning = "Image-based AI Inference";

    // --- TIER 2: FAIL-SAFE OVERRIDE ENGINE ---
    // If the AI says Negative, we double check the vitals.
    if (result.toLowerCase() === "negative") {
      let isAbnormal = false;
      let riskScore = 0;
      
      const t = Number(temperature);
      const o2 = Number(spo2_reading);
      const symp = symptoms || "";
      
      // 1. Check for clinical risk (High Fever / Low Oxygen)
      if (t > 100.5) riskScore += 2;
      if (o2 < 94) riskScore += 3;
      if (symp.includes("Fever")) riskScore += 3;
      if (symp.includes("Chills")) riskScore += 2;
      
      if (riskScore >= 5) isAbnormal = true;

      // 2. Check for impossible/sensor-glitch vitals (e.g. 50°F)
      if (t < 90 || t > 110 || o2 < 50) isAbnormal = true;

      // If anything is abnormal, override the AI
      if (isAbnormal) {
        result = "Presumptive Positive";
        confidence = 85; 
        reasoning = `Clinical Override (Abnormal Vitals Detected)`;
      }
    }

    // --- PERSIST VISIT DATA ---
    const visit_id = crypto.randomUUID();
    await dbRun(
      `INSERT INTO visits (id, patient_id, temperature, spo2_reading, symptoms, result, confidence, reasoning, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [visit_id, patient_id, temperature, spo2_reading, symptoms, result, confidence, reasoning, image_url]
    );

    const fullHistory = await dbAll(`SELECT * FROM visits WHERE patient_id = ? ORDER BY created_at DESC`, [patient_id]);
    res.status(201).json({ result, confidence, reasoning, history: fullHistory });

  } catch (error) { 
    res.status(500).json({ error: "Diagnostic Pipeline Error: " + error.message }); 
  }
};

// 3. DASHBOARD ANALYTICS
const getDashboard = async (req, res) => {
  try {
    const patients = await dbAll(`SELECT * FROM patients ORDER BY created_at DESC`);
    const visits = await dbAll(`SELECT * FROM visits ORDER BY created_at DESC`);
    
    const positive = visits.filter(v => v.result.toLowerCase().includes("positive")).length;
    const rate = visits.length > 0 ? ((positive / visits.length) * 100).toFixed(1) : 0;

    res.json({ 
      total_patients: patients.length, 
      total_tests: visits.length, 
      positive_cases: positive, 
      positivity_rate: `${rate}%`, 
      patients: patients, 
      visits: visits 
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { lookupPatient, submitVisit, getDashboard };