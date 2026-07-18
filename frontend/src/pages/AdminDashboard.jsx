import React, { useState } from 'react';
import Layout from '../components/Layout';
import StaffManagement from '../components/admin/StaffManagement';
import LogViewer from '../components/admin/LogViewer';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('staff');

  return (
    <Layout title="Admin Dashboard">
      <div className="flex border-b border-gray-200 bg-gray-50/50">
        <button 
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'staff' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Staff Management
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'logs' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          System Logs
        </button>
      </div>
      
      <div>
        {activeTab === 'staff' ? <StaffManagement /> : <LogViewer />}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
