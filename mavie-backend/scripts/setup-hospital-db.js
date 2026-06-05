require("dotenv").config();
const pool = require("../src/db");

async function setupHospitalDatabase() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await pool.query(`
      ALTER TABLE emergency_events
      ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES users(user_id)
    `);

    await pool.query(`
      ALTER TABLE emergency_events
      ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_event_responses (
        response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        emergency_event_id BIGINT NOT NULL REFERENCES emergency_events(emergency_event_id) ON DELETE CASCADE,
        responder_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        response_status VARCHAR(20) NOT NULL CHECK (response_status IN ('Accepted', 'Rejected')),
        responded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (emergency_event_id, responder_user_id)
      )
    `);

    console.log("Hospital response database setup completed");
  } catch (error) {
    console.error("Hospital DB setup failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupHospitalDatabase();