import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

const PatientHistory = ({ patientId, onClose }) => {
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/patients/${patientId}`);
        setPatient(response.data);
      } catch (error) {
        console.error('Error fetching patient history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [patientId]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading patient history...</div>;
  }

  if (!patient) {
    return <div className="p-8 text-center text-red-500">Failed to load patient data.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
      <div className="bg-indigo-50 px-6 py-4 flex justify-between items-center border-b border-indigo-100">
        <div>
          <h3 className="text-xl font-bold text-indigo-900">{patient.name}'s Medical History</h3>
          <p className="text-sm text-indigo-700">DOB: {new Date(patient.dob).toLocaleDateString()} | Phone: {patient.phone}</p>
        </div>
        <button onClick={onClose} className="text-indigo-600 hover:text-indigo-900 font-bold bg-white px-3 py-1 rounded-md shadow-sm border border-indigo-200">
          Close History
        </button>
      </div>

      <div className="p-6">
        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Past Medical Records</h4>
        {patient.medical_records && patient.medical_records.length > 0 ? (
          <div className="space-y-6">
            {patient.medical_records.map(record => (
              <div key={record.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gray-900">Dr. {record.doctor?.name}</span>
                  <span className="text-sm text-gray-500">{new Date(record.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mb-2">
                  <span className="text-xs uppercase font-bold text-gray-500 block">Diagnosis</span>
                  <p className="text-gray-800 text-sm mt-1">{record.diagnosis}</p>
                </div>
                {record.prescription && (
                  <div className="mb-2">
                    <span className="text-xs uppercase font-bold text-gray-500 block">Prescription</span>
                    <p className="text-gray-800 text-sm mt-1 bg-white p-2 border rounded-md">{record.prescription}</p>
                  </div>
                )}
                {record.attachments && record.attachments.length > 0 && (
                  <div className="mt-3">
                    <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Attachments</span>
                    <div className="flex flex-wrap gap-2">
                      {record.attachments.map(att => (
                        <a 
                          key={att.id} 
                          href={att.file_url.startsWith('http') ? att.file_url : `http://localhost:8000${att.file_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                        >
                          View File
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No past medical records found for this patient.</p>
        )}
      </div>
    </div>
  );
};

export default PatientHistory;
