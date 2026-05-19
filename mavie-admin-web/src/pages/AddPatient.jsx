import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getPatients, savePatients } from "../data/patients";

function AddPatient() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    condition: "",
    status: "Stable",
    lastMedication: "Pending",
    emergencyContact: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    const currentPatients = getPatients();

    const newPatient = {
      id: Date.now(),
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender,
      phone: formData.phone,
      condition: formData.condition,
      status: formData.status,
      lastMedication: formData.lastMedication,
      emergencyContact: formData.emergencyContact,
    };

    const updatedPatients = [...currentPatients, newPatient];

    savePatients(updatedPatients);

    navigate("/patients");
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Patient</h1>
          <p>Register a new patient into the Ma Vie admin system.</p>
        </div>

        <Link to="/patients" className="secondary-btn">
          Back
        </Link>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter patient name"
              required
            />
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              name="age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter age"
              required
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="form-group">
            <label>Health Condition</label>
            <input
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              placeholder="Example: Diabetes, Hypertension"
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Stable">Stable</option>
              <option value="Needs Attention">Needs Attention</option>
            </select>
          </div>

          <div className="form-group">
            <label>Last Medication</label>
            <select
              name="lastMedication"
              value={formData.lastMedication}
              onChange={handleChange}
            >
              <option value="Taken">Taken</option>
              <option value="Missed">Missed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label>Emergency Contact</label>
            <input
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleChange}
              placeholder="Enter emergency contact name"
              required
            />
          </div>
        </div>

        <button type="submit" className="primary-btn">
          Save Patient
        </button>
      </form>
    </div>
  );
}

export default AddPatient;