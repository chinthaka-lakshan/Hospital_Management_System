import React, { useState } from 'react';
import Layout from '../components/Layout';
import PatientManagement from '../components/receptionist/PatientManagement';
import Scheduling from '../components/receptionist/Scheduling';

const ReceptionistDashboard = () => {
  const [activeTab, setActiveTab] = useState('patients');

  return (
    <Layout title="Receptionist Dashboard">
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button 
          onClick={() => setActiveTab('patients')}
          className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'patients' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Patient Directory
        </button>
        <button 
          onClick={() => setActiveTab('scheduling')}
          className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'scheduling' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Appointment Schedule
        </button>
      </div>
      
      <div>
        {activeTab === 'patients' ? <PatientManagement /> : <Scheduling />}
      </div>
    </Layout>
  );
};

export default ReceptionistDashboard;
