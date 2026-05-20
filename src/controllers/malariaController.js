const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const dbPath = path.join(__dirname, "../../malaria.db");
const db = new sqlite3.Database(dbPath);

// ADDED 'symptoms' column
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    location TEXT,
    spo2_reading INTEGER,
    temperature REAL,
    symptoms TEXT,
    alert_sent INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    result TEXT,
    confidence INTEGER,
    species TEXT,
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

const submitSpO2 = async (req, res) => {
  const { name, phone, location, spo2_reading, temperature, symptoms } = req.body;
  if (!name || spo2_reading === undefined || temperature === undefined) return res.status(400).json({ error: "Missing data" });

  const alert_sent = (spo2_reading < 94 || temperature > 100) ? 1 : 0;
  const id = crypto.randomUUID();

  try {
    await dbRun(
      `INSERT INTO patients (id, name, phone, location, spo2_reading, temperature, symptoms, alert_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, phone, location, spo2_reading, temperature, symptoms || "", alert_sent]
    );
    const rows = await dbAll(`SELECT * FROM patients WHERE id = ?`, [id]);
    res.status(201).json({ patient: rows[0], alert_sent: !!alert_sent });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const getAlerts = async (req, res) => {
  try {
    const rows = await dbAll(`SELECT * FROM patients WHERE alert_sent = 1 ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

const submitTest = async (req, res) => {
  const patient_id = req.body.patient_id;
  const imageFile = req.file; 
  if (!patient_id || !imageFile) return res.status(400).json({ error: "patient_id and image required" });

  const id = crypto.randomUUID();
  const image_url = `/uploads/${imageFile.filename}`;

  try {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(imageFile.path));

    const aiResponse = await axios.post("http://127.0.0.1:5000/predict", formData, { headers: formData.getHeaders() });
    
    // 1. Primary AI Inference
    let { result, confidence, species } = aiResponse.data;
    let reasoning = "Image-based AI Inference";

    // 2. Secondary Clinical Risk Fallback
    console.log(`\n--- AI Returned: ${result.toUpperCase()} ---`);
    if (result === "negative") {
      const pRows = await dbAll(`SELECT * FROM patients WHERE id = ?`, [patient_id]);
      if (pRows.length > 0) {
        const p = pRows[0];
        let riskScore = 0;
        
        // Force Javascript to treat these as numbers, not text
        const t = Number(p.temperature);
        const o2 = Number(p.spo2_reading);
        const symp = p.symptoms || ""; // Fallback if frontend forgot to send symptoms

        console.log(`Analyzing Vitals -> Temp: ${t}, SpO2: ${o2}, Symptoms: [${symp}]`);

        // WHO Scoring Logic
        if (t > 100.5) riskScore += 2;
        if (o2 < 94) riskScore += 3;
        if (symp.includes("Fever")) riskScore += 3;
        if (symp.includes("Chills")) riskScore += 2;

        console.log(`Final Calculated Risk Score: ${riskScore}/10`);

        // If high risk, OVERRIDE the AI
        if (riskScore >= 5) {
          result = "Presumptive Positive";
          confidence = 85; 
          species = "Pending Lab Confirmation";
          reasoning = `Clinical Override (Risk Score: ${riskScore}/10)`;
          console.log(`⚠️ ACTION: AI Overruled by Clinical Engine!`);
        } else {
          console.log(`✅ ACTION: Risk too low to override AI.`);
        }
      }
    }

    await dbRun(
      `INSERT INTO tests (id, patient_id, result, confidence, species, reasoning, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, patient_id, result, confidence, species, reasoning, image_url]
    );

    const rows = await dbAll(`SELECT * FROM tests WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);

  } catch (error) { res.status(500).json({ error: "ML Server Error" }); }
};
const getDashboard = async (req, res) => {
  try {
    const patients = await dbAll(`SELECT * FROM patients`);
    const tests = await dbAll(`SELECT * FROM tests`);
    // Count both "positive" and "Presumptive Positive"
    const positive = tests.filter(t => t.result.toLowerCase().includes("positive")).length;
    const total = tests.length;
    const positivity_rate = total > 0 ? ((positive / total) * 100).toFixed(1) : 0;

    const recent_tests = await dbAll(`
      SELECT t.*, p.name, p.location, p.spo2_reading, p.temperature 
      FROM tests t JOIN patients p ON t.patient_id = p.id ORDER BY t.created_at DESC LIMIT 10
    `);

    res.json({ total_patients: patients.length, total_tests: total, positive_cases: positive, positivity_rate: `${positivity_rate}%`, recent_tests });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { submitSpO2, getAlerts, submitTest, getDashboard };