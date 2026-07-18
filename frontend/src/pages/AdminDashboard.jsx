import React from 'react';
import Layout from '../components/Layout';
import StaffManagement from '../components/admin/StaffManagement';

const AdminDashboard = () => {
  return (
    <Layout title="Admin Dashboard">
      <div className="p-2"> 
        <StaffManagement />
      </div>
    </Layout>
  );
};

export default AdminDashboard;