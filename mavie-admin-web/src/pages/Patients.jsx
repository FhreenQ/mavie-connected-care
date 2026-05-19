import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../data/patients";

function Patients() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    setPatients(getPatients());
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>Manage registered patients and monitor their medication status.</p>
        </div>

        <Link to="/patients/add" className="primary-btn">
          + Add Patient
        </Link>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age</th>
              <th>Condition</th>
              <th>Status</th>
              <th>Last Medication</th>
              <th>Emergency Contact</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>
                  <strong>{patient.name}</strong>
                  <br />
                  <span>{patient.phone}</span>
                </td>
                <td>{patient.age}</td>
                <td>{patient.condition}</td>
                <td>
                  <span
                    className={
                      patient.status === "Stable"
                        ? "badge success"
                        : "badge warning"
                    }
                  >
                    {patient.status}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      patient.lastMedication === "Taken"
                        ? "badge success"
                        : patient.lastMedication === "Missed"
                        ? "badge danger"
                        : "badge warning"
                    }
                  >
                    {patient.lastMedication}
                  </span>
                </td>
                <td>{patient.emergencyContact}</td>
                <td>
                  <Link className="view-link" to={`/patients/${patient.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Patients;