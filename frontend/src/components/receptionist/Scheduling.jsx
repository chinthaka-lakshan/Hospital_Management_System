import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';

const Scheduling = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    notes: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [apptRes, pRes, dRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/doctors')
      ]);
      setAppointments(apptRes.data);
      setPatients(pRes.data);
      setDoctors(dRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Format date for Laravel (Y-m-d H:i:s)
      const dateObj = new Date(formData.appointment_date);
      const formattedDate = dateObj.toISOString().slice(0, 19).replace('T', ' ');
      
      await api.post('/appointments', {
        ...formData,
        appointment_date: formattedDate
      });
      
      setFormData({ patient_id: '', doctor_id: '', appointment_date: '', notes: '' });
      setShowForm(false);
      fetchData(); // refresh list
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to book appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 border-t border-gray-200">
      <div className="flex justify-between items-center mb-6 mt-4">
        <h2 className="text-xl font-bold text-gray-800">Appointment Schedule</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          {showForm ? 'Cancel Booking' : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Book Appointment
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8 shadow-sm">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Book New Appointment</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
              <select name="patient_id" required value={formData.patient_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option value="">-- Choose Patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} (ID: {p.id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Doctor</label>
              <select name="doctor_id" required value={formData.doctor_id} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                <option value="">-- Choose Doctor --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
              <input type="datetime-local" name="appointment_date" required value={formData.appointment_date} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Notes</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Patient reporting headache..." />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70">
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">No appointments scheduled yet.</div>
        ) : (
          appointments.map(appt => (
            <div key={appt.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${appt.status === 'scheduled' ? 'bg-indigo-500' : appt.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mb-2 ${appt.status === 'scheduled' ? 'bg-indigo-100 text-indigo-800' : appt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {appt.status}
                  </span>
                  <h4 className="font-bold text-gray-900">{new Date(appt.appointment_date).toLocaleString()}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Doctor</p>
                  <p className="text-sm font-medium text-gray-800">{appt.doctor?.name}</p>
                </div>
              </div>
              <div className="pl-2 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500 mb-1">Patient:</p>
                <p className="font-medium text-gray-900">{appt.patient?.name}</p>
                {appt.notes && (
                  <div className="mt-3 bg-gray-50 p-3 rounded-md text-sm text-gray-600 border border-gray-100">
                    <span className="font-semibold block mb-1">Notes:</span>
                    {appt.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Scheduling;
