import React from 'react';
import { useAuth } from './Auth/AuthProvider'; // Make sure this path is correct
import { SpecialistDashboard } from './Dashboard/SpecialistDashboard'; // Make sure this path is correct
import { ConsultingDoctorDashboard } from './Dashboard/ConsultingDoctorDashboard'; // Make sure this path is correct
import { ConnectionStatus } from '../types'; // Make sure this path is correct

export const DashboardRedirect: React.FC = () => {
  const { userProfile, logout } = useAuth();

  const notImplemented = (feature: string) => {
    alert(`${feature} is not implemented yet.`);
  };

  const connectionStatus: ConnectionStatus = {
    isOnline: navigator.onLine,
    speed: 'fast',
    dataUsed: 0
  };

  if (!userProfile) {
    return <div>Error: No user found.</div>;
  }

  // Check the user's role and render the corresponding dashboard
  if (userProfile.role === 'specialist') {
    return (
      <SpecialistDashboard
        user={userProfile}
        onLogout={logout}
        connectionStatus={connectionStatus}
        notImplemented={notImplemented}
      />
    );
  } else {
    // Default to the consulting doctor dashboard
    return (
      <ConsultingDoctorDashboard
        user={userProfile}
        onLogout={logout}
        connectionStatus={connectionStatus}
        notImplemented={notImplemented}
      />
    );
  }
};