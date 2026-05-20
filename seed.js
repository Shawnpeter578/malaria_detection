const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const crypto = require("crypto");

const dbPath = path.join(__dirname, "malaria.db");
const db = new sqlite3.Database(dbPath);

const dbRun = (query, params) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) {
    if (err) reject(err); else resolve(this);
  });
});

async function seedDatabase() {
  console.log("🌱 Seeding database with realistic PHC data...");

  // Generate 10 realistic patients
  const villages = ["Ullal", "Someshwara", "Kotekar", "Talapady"];
  const patients = [];

  for (let i = 0; i < 10; i++) {
    const id = crypto.randomUUID();
    const isCritical = Math.random() > 0.7; // 30% chance of low SpO2
    const spo2 = isCritical ? Math.floor(Math.random() * (93 - 85) + 85) : Math.floor(Math.random() * (99 - 95) + 95);
    
    patients.push({
      id,
      name: `Patient ${i + 1}`,
      phone: `+91 987654321${i}`,
      location: villages[Math.floor(Math.random() * villages.length)],
      spo2_reading: spo2,
      alert_sent: isCritical ? 1 : 0
    });
  }

  for (const p of patients) {
    await dbRun(
      `INSERT INTO patients (id, name, phone, location, spo2_reading, alert_sent) VALUES (?, ?, ?, ?, ?, ?)`,
      [p.id, p.name, p.phone, p.location, p.spo2_reading, p.alert_sent]
    );
  }

  // Generate a few AI tests for the critical patients
  const criticalPatients = patients.filter(p => p.alert_sent === 1);
  for (const p of criticalPatients) {
    const isPositive = Math.random() > 0.5; // 50/50 chance of malaria
    await dbRun(
      `INSERT INTO tests (id, patient_id, result, confidence, species, reasoning) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(), 
        p.id, 
        isPositive ? "positive" : "negative", 
        Math.floor(Math.random() * (99 - 85) + 85), // 85-99% confidence
        isPositive ? "P. falciparum" : "N/A",
        "AI pre-screening complete"
      ]
    );
  }

  console.log("✅ Database seeded successfully! Your dashboard will now look amazing.");
  db.close();
}

seedDatabase();