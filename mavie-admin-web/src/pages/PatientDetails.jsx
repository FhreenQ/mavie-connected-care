import { useParams, Link } from "react-router-dom";
import { getPatientById } from "../data/patients";

function PatientDetails() {
  const { id } = useParams();

  const patient = getPatientById(id);

  if (!patient) {
    return (
      <div className="page">
        <h1>Patient Not Found</h1>
        <Link to="/patients" className="view-link">
          Back to Patients
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{patient.name}</h1>
          <p>Patient details, health profile, and emergency information.</p>
        </div>

        <Link to="/patients" className="secondary-btn">
          Back
        </Link>
      </div>

      <div className="details-grid">
        <div className="info-card">
          <h2>Basic Information</h2>
          <p><strong>Name:</strong> {patient.name}</p>
          <p><strong>Age:</strong> {patient.age}</p>
          <p><strong>Gender:</strong> {patient.gender}</p>
          <p><strong>Phone:</strong> {patient.phone}</p>
        </div>

        <div className="info-card">
          <h2>Health Profile</h2>
          <p><strong>Condition:</strong> {patient.condition}</p>
          <p><strong>Status:</strong> {patient.status}</p>
          <p><strong>Allergies:</strong> Not added yet</p>
          <p><strong>Blood Type:</strong> Not added yet</p>
        </div>

        <div className="info-card">
          <h2>Medication Status</h2>
          <p><strong>Last Medication:</strong> {patient.lastMedication}</p>
          <p><strong>Today’s Schedule:</strong> Not connected yet</p>
          <p><strong>Missed Count:</strong> Not connected yet</p>
        </div>

        <div className="info-card">
          <h2>Emergency Contact</h2>
          <p><strong>Name:</strong> {patient.emergencyContact}</p>
          <p><strong>Relationship:</strong> Family member</p>
          <p><strong>Phone:</strong> Not added yet</p>
        </div>
      </div>
    </div>
  );
}

export default PatientDetails;