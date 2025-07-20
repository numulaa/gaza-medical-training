// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from './AuthProvider';
import { UnifiedAuthComponent } from './UnifiedAuthComponent';
import { Stethoscope } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Stethoscope size={48} className="text-red-500 mx-auto mb-4 animate-pulse" />
          <div className="text-white text-lg">Loading...</div>
          <div className="text-gray-400 text-sm mt-2">Checking authentication status</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <UnifiedAuthComponent />;
  }

  return <>{children}</>;
};