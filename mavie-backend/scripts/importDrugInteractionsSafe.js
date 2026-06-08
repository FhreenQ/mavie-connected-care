
require("dotenv").config();

const fs = require("fs");
const csv = require("csv-parser");
const { Pool } = require("pg");

const csvPath = process.argv[2];

if (!csvPath) {
  console.error("Usage: node scripts/importDrugInteractionsSafe.js ./db_drug_interactions.csv");
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error("CSV file not found:", csvPath);
  process.exit(1);
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
);

function normalizeDrugName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function makePairKey(drugA, drugB) {
  const a = normalizeDrugName(drugA);
  const b = normalizeDrugName(drugB);
  return [a, b].sort().join("||");
}

function getValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
  }

  // Handles hidden BOM in CSV header
  const keys = Object.keys(row);
  for (const key of keys) {
    const cleanKey = key.replace(/^\uFEFF/, "");
    if (names.includes(cleanKey)) return row[key];
  }

  return "";
}

async function createTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS drug_interactions (
      id BIGSERIAL PRIMARY KEY,
      drug1 TEXT NOT NULL,
      drug2 TEXT NOT NULL,
      drug1_norm TEXT NOT NULL,
      drug2_norm TEXT NOT NULL,
      pair_key TEXT NOT NULL UNIQUE,
      interaction_description TEXT NOT NULL,
      source TEXT DEFAULT 'db_drug_interactions.csv',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug1_norm
    ON drug_interactions (drug1_norm);

    CREATE INDEX IF NOT EXISTS idx_drug_interactions_drug2_norm
    ON drug_interactions (drug2_norm);

    CREATE INDEX IF NOT EXISTS idx_drug_interactions_pair_key
    ON drug_interactions (pair_key);
  `);
}

async function insertRow(row) {
  const drug1 = getValue(row, ["Drug 1", "drug1", "drug_1"]);
  const drug2 = getValue(row, ["Drug 2", "drug2", "drug_2"]);
  const description = getValue(row, [
    "Interaction Description",
    "interaction_description",
    "description",
  ]);

  if (!drug1 || !drug2 || !description) {
    return { inserted: false, skipped: true };
  }

  const drug1Norm = normalizeDrugName(drug1);
  const drug2Norm = normalizeDrugName(drug2);
  const pairKey = makePairKey(drug1, drug2);

  const result = await pool.query(
    `
    INSERT INTO drug_interactions
      (drug1, drug2, drug1_norm, drug2_norm, pair_key, interaction_description)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (pair_key) DO NOTHING
    RETURNING id;
    `,
    [drug1, drug2, drug1Norm, drug2Norm, pairKey, description]
  );

  return {
    inserted: result.rowCount > 0,
    skipped: result.rowCount === 0,
  };
}

async function main() {
  console.log("Connecting to PostgreSQL...");
  await pool.query("SELECT NOW()");
  console.log("Connected.");

  console.log("Creating table if not exists...");
  await createTable();

  let total = 0;
  let inserted = 0;
  let skipped = 0;
  const batch = [];

  console.log("Reading CSV:", csvPath);

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      batch.push(row);
    })
    .on("end", async () => {
      try {
        for (const row of batch) {
          total++;

          const result = await insertRow(row);
          if (result.inserted) inserted++;
          if (result.skipped) skipped++;

          if (total % 5000 === 0) {
            console.log(`Processed ${total} rows... Inserted: ${inserted}, Skipped: ${skipped}`);
          }
        }

        console.log("Import complete.");
        console.log("Total rows processed:", total);
        console.log("Inserted:", inserted);
        console.log("Skipped duplicates/invalid:", skipped);
      } catch (error) {
        console.error("Import failed:", error.message);
      } finally {
        await pool.end();
      }
    });
}

main().catch(async (error) => {
  console.error("Error:", error.message);
  await pool.end();
});
