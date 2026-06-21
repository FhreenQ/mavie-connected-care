const pool = require("../db");

async function markOverdueMedicationDoses(userId = null) {
  const userFilter = userId ? "AND s.user_id = $1" : "";
  const params = userId ? [userId] : [];

  const result = await pool.query(
    `INSERT INTO medication_logs
       (schedule_id, scheduled_time, taken_at, status, recorded_by, note)
     SELECT
       s.schedule_id,
       s.next_dose_time,
       NULL,
       'Skipped',
       COALESCE(s.created_by, s.user_id),
       'Automatically marked skipped one hour after the scheduled time.'
     FROM schedules s
     WHERE s.active = TRUE
       ${userFilter}
       AND s.next_dose_time <= NOW() - INTERVAL '1 hour'
       AND s.next_dose_time >= date_trunc('day', NOW())
       AND s.next_dose_time < date_trunc('day', NOW()) + INTERVAL '1 day'
       AND NOT EXISTS (
         SELECT 1
         FROM medication_logs ml
         WHERE ml.schedule_id = s.schedule_id
           AND ml.scheduled_time = s.next_dose_time
       )
     RETURNING log_id, schedule_id, scheduled_time, taken_at, status, note, created_at`,
    params
  );

  return result.rows;
}

module.exports = { markOverdueMedicationDoses };
