import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import PatientHistory from './PatientHistory';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [viewingHistoryFor, setViewingHistoryFor] = useState(null);
  
  // Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [files, setFiles] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('appointment_id', selectedAppt.id);
      formData.append('patient_id', selectedAppt.patient_id);
      formData.append('diagnosis', diagnosis);
      if (prescription) formData.append('prescription', prescription);
      
      if (files) {
        Array.from(files).forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });
      }

      await api.post('/medical-records', formData);
      
      // Also update the appointment status to 'completed'
      await api.put(`/appointments/${selectedAppt.id}`, { status: 'completed' });
      
      alert('Medical record saved successfully!');
      setSelectedAppt(null);
      setDiagnosis('');
      setPrescription('');
      setFiles(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error saving medical record:', error);
      alert('Failed to save medical record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedAppt) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setSelectedAppt(null)} className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Appointments
          </button>
          
          <button 
            onClick={() => setViewingHistoryFor(viewingHistoryFor ? null : selectedAppt.patient_id)}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
          >
            {viewingHistoryFor ? 'Hide Medical History' : 'View Medical History'}
          </button>
        </div>

        {viewingHistoryFor && (
          <PatientHistory patientId={viewingHistoryFor} onClose={() => setViewingHistoryFor(null)} />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">Consultation: {selectedAppt.patient?.name}</h3>
            <p className="text-sm text-gray-500">{new Date(selectedAppt.appointment_date).toLocaleString()}</p>
          </div>
          
          <form onSubmit={handleSubmitRecord} className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Diagnosis <span className="text-red-500">*</span></label>
              <textarea 
                required 
                rows="4" 
                value={diagnosis} 
                onChange={(e) => setDiagnosis(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder="Enter detailed diagnosis..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription / Treatment Plan</label>
              <textarea 
                rows="3" 
                value={prescription} 
                onChange={(e) => setPrescription(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                placeholder="Medications, dosages, next steps..."
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Images / Attachments (Optional)</label>
              <input 
                type="file" 
                multiple 
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="text-xs text-gray-500 mt-1">Accepts JPEG, PNG, and PDF (Max 10MB per file)</p>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70"
              >
                {isSubmitting ? 'Saving Record...' : 'Complete Consultation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Today's Schedule</h2>
      
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          No appointments assigned to you today.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map(appt => (
            <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
              <div className={`absolute top-0 left-0 w-1 h-full ${appt.status === 'scheduled' ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
              <div className="flex-1 pl-2">
                <div className="flex justify-between items-start mb-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${appt.status === 'scheduled' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                    {appt.status}
                  </span>
                  <span className="text-sm font-bold text-gray-700">{new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{appt.patient?.name}</h4>
                <p className="text-sm text-gray-500 mb-4">{new Date(appt.appointment_date).toLocaleDateString()}</p>
                {appt.notes && (
                  <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-800 border border-orange-100 mb-4">
                    <span className="font-semibold block mb-1">Receptionist Notes:</span>
                    {appt.notes}
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 pl-2">
                <button 
                  onClick={() => setSelectedAppt(appt)}
                  className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Start Consultation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
