import React from 'react';
import Layout from '../components/Layout';
import DoctorAppointments from '../components/doctor/DoctorAppointments';

const DoctorDashboard = () => {
  return (
    <Layout title="Doctor Dashboard">
      <DoctorAppointments />
    </Layout>
  );
};

export default DoctorDashboard;
