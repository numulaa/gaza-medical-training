import React, { useState, useEffect } from 'react';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { JoinConsultationForm } from './components/JoinConsultation/JoinConsultationForm';
import { ConsultingDoctorDashboard } from './components/Dashboard/ConsultingDoctorDashboard';
import { SpecialistDashboard } from './components/Dashboard/SpecialistDashboard';
import { ConsultationThread } from './components/Consultation/ConsultationThread';
import { ToastContainer } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { Consultation } from './types';

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'join'>('login');
  const [joinedConsultation, setJoinedConsultation] = useState<Consultation | null>(null);
  const { user, loading, login, register, logout } = useAuth();
  const { toasts, showToast, removeToast, notImplemented } = useToast();
  const connectionStatus = useConnectionStatus();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  // Show offline notification
  useEffect(() => {
    if (!connectionStatus.isOnline) {
      showToast('App is running in offline mode', 'warning', 0);
    }
  }, [connectionStatus.isOnline, showToast]);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const success = await login(email, password);
      if (success) {
        showToast('Successfully logged in', 'success');
      } else {
        showToast('Invalid credentials', 'error');
      }
      return success;
    } catch (error) {
      showToast('Login failed', 'error');
      return false;
    }
  };

  const handleRegister = async (userData: any): Promise<boolean> => {
    try {
      const success = await register(userData);
      if (success) {
        if (userData.role === 'specialist') {
          showToast('Registration successful! Awaiting admin approval for specialist access.', 'info', 7000);
        } else {
          showToast('Registration successful!', 'success');
        }
      } else {
        showToast('Registration failed', 'error');
      }
      return success;
    } catch (error) {
      showToast('Registration failed', 'error');
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
  };

  const handleJoinConsultation = async (code: string): Promise<boolean> => {
    // Mock consultation lookup by code
    const mockConsultations: { [key: string]: Consultation } = {
      'ABC-DEF-GHI': {
        id: 'join-1',
        title: 'Chest trauma - 23M soldier',
        description: 'Shrapnel wound to chest, difficulty breathing, BP 90/60. Patient conscious but in distress. Need immediate surgical consultation.',
        specialty: 'Trauma Surgery',
        priority: 'emergency',
        status: 'in_progress',
        createdBy: 'field_doc_1',
        createdByName: 'Dr. Ahmad',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(),
        accessCode: code,
        responses: [
          {
            id: 'r1',
            consultationId: 'join-1',
            userId: 'field_doc_1',
            userName: 'Dr. Ahmad',
            content: 'Patient vitals: HR 120, BP 90/60, RR 28, O2 sat 88% on room air. Visible chest wound with possible pneumothorax.',
            createdAt: new Date(Date.now() - 8 * 60 * 1000),
            source: 'whatsapp'
          }
        ],
        source: 'whatsapp'
      },
      'XYZ-123-456': {
        id: 'join-2',
        title: 'Pediatric fever - 5yr old',
        description: 'High fever 39.5°C for 2 days, no obvious infection source, mild dehydration. Parents concerned about meningitis.',
        specialty: 'Pediatrics',
        priority: 'urgent',
        status: 'open',
        createdBy: 'field_doc_2',
        createdByName: 'Dr. Sarah',
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        updatedAt: new Date(),
        accessCode: code,
        responses: [],
        source: 'web'
      }
    };

    const consultation = mockConsultations[code];
    if (consultation) {
      setJoinedConsultation(consultation);
      showToast('Successfully joined consultation', 'success');
      return true;
    } else {
      showToast('Invalid consultation code', 'error');
      return false;
    }
  };

  const handleSendResponse = async (content: string) => {
    notImplemented('Send Response');
  };

  const handleMarkResolved = () => {
    notImplemented('Mark Consultation as Resolved');
  };

  // Handle URL-based routing for join functionality
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/join') {
      setCurrentView('join');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Handle joined consultation view (accessible without login)
  if (joinedConsultation) {
    return (
      <>
        <ConsultationThread
          consultation={joinedConsultation}
          currentUser={user || { id: 'guest', name: 'Guest', email: '', role: 'specialist', isApproved: true, availabilityStatus: 'available' }}
          connectionStatus={connectionStatus}
          onBack={() => setJoinedConsultation(null)}
          onSendResponse={handleSendResponse}
          onMarkResolved={handleMarkResolved}
          notImplemented={notImplemented}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (!user) {
    return (
      <>
        {currentView === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        ) : currentView === 'join' ? (
          <JoinConsultationForm
            onJoinConsultation={handleJoinConsultation}
            onBack={() => setCurrentView('login')}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (user.role === 'specialist' && !user.isApproved) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Awaiting Approval</h2>
          <p className="text-gray-300 mb-6">
            Your specialist account is pending admin approval. You'll receive an email once approved.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white transition-colors"
          >
            Logout
          </button>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  return (
    <>
      {user.role === 'consulting_doctor' ? (
        <ConsultingDoctorDashboard
          user={user}
          connectionStatus={connectionStatus}
          onLogout={handleLogout}
          notImplemented={notImplemented}
        />
      ) : (
        <SpecialistDashboard
          user={user}
          connectionStatus={connectionStatus}
          onLogout={handleLogout}
          notImplemented={notImplemented}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;