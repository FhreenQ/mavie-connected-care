const pool = require("../src/db");

async function setupNurseCareDb() {
  try {
    await pool.query("SET lock_timeout TO '5s'");
    await pool.query("SET statement_timeout TO '15s'");

    console.log("Creating nurse care tables...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nurse_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
        phone VARCHAR(100),
        department VARCHAR(150),
        ward VARCHAR(150),
        shift VARCHAR(150),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS nurse_patient_notes (
        nurse_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        patient_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        age VARCHAR(20),
        gender VARCHAR(50),
        room VARCHAR(150),
        notes TEXT,
        emergency_contact_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (nurse_user_id, patient_user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS nurse_emergency_event_logs (
        event_log_id BIGSERIAL PRIMARY KEY,
        emergency_event_id BIGINT NOT NULL REFERENCES emergency_events(emergency_event_id) ON DELETE CASCADE,
        nurse_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        action VARCHAR(30) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      UPDATE caregiver_patient_links cpl
      SET can_manage_schedule = TRUE
      FROM users u
      WHERE cpl.caregiver_user_id = u.user_id
        AND cpl.active = TRUE
        AND LOWER(u.role::text) IN ('nurse', 'caregiver')
    `);

    console.log("Nurse care database tables are ready.");
  } catch (error) {
    console.error("Unable to set up nurse care tables:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setupNurseCareDb();
