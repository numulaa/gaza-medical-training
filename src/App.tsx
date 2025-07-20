import { useState, useEffect } from "react";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { UnifiedAuthComponent } from "./components/Auth/UnifiedAuthComponent";
import { JoinConsultationForm } from "./components/JoinConsultation/JoinConsultationForm";
import { ConsultingDoctorDashboard } from "./components/Dashboard/ConsultingDoctorDashboard";
import { SpecialistDashboard } from "./components/Dashboard/SpecialistDashboard";
import { ConsultationThread } from "./components/Consultation/ConsultationThread";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { Consultation } from "./types";
import { Stethoscope } from 'lucide-react';

// Main App Content Component (inside AuthProvider context)
const AppContent = () => {
  const [currentView, setCurrentView] = useState<"auth" | "join">("auth");
  const [joinedConsultation, setJoinedConsultation] = useState<Consultation | null>(null);
  
  const { currentUser, userProfile, logout, loading } = useAuth();
  const { toasts, showToast, removeToast, notImplemented } = useToast();
  const connectionStatus = useConnectionStatus();

  // Handle URL-based routing for join functionality
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/join") {
      setCurrentView("join");
    }
  }, []);

  // Show offline notification
  useEffect(() => {
    if (!connectionStatus.isOnline) {
      showToast("App is running in offline mode", "warning", 0);
    }
  }, [connectionStatus.isOnline, showToast]);

  const handleJoinConsultation = async (code: string): Promise<boolean> => {
    // Mock consultation lookup by code (your existing logic)
    const mockConsultations: { [key: string]: Consultation } = {
      "ABC-DEF-GHI": {
        id: "join-1",
        title: "Chest trauma - 23M soldier",
        description:
          "Shrapnel wound to chest, difficulty breathing, BP 90/60. Patient conscious but in distress. Need immediate surgical consultation.",
        specialty: "Trauma Surgery",
        priority: "emergency",
        status: "in_progress",
        createdBy: "field_doc_1",
        createdByName: "Dr. Ahmad",
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
        updatedAt: new Date(),
        accessCode: code,
        responses: [
          {
            id: "r1",
            consultationId: "join-1",
            userId: "field_doc_1",
            userName: "Dr. Ahmad",
            content:
              "Patient vitals: HR 120, BP 90/60, RR 28, O2 sat 88% on room air. Visible chest wound with possible pneumothorax.",
            createdAt: new Date(Date.now() - 8 * 60 * 1000),
            source: "whatsapp",
          },
        ],
        source: "whatsapp",
      },
      "XYZ-123-456": {
        id: "join-2",
        title: "Pediatric fever - 5yr old",
        description:
          "High fever 39.5°C for 2 days, no obvious infection source, mild dehydration. Parents concerned about meningitis.",
        specialty: "Pediatrics",
        priority: "urgent",
        status: "open",
        createdBy: "field_doc_2",
        createdByName: "Dr. Sarah",
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
        updatedAt: new Date(),
        accessCode: code,
        responses: [],
        source: "web",
      },
    };

    const consultation = mockConsultations[code];
    if (consultation) {
      setJoinedConsultation(consultation);
      showToast("Successfully joined consultation", "success");
      return true;
    } else {
      showToast("Invalid consultation code", "error");
      return false;
    }
  };

  const handleSendResponse = async (_: string) => {
    notImplemented("Send Response");
  };

  const handleMarkResolved = () => {
    notImplemented("Mark Consultation as Resolved");
  };

  const handleLogout = () => {
    logout();
    showToast("Logged out successfully", "info");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Stethoscope size={48} className="text-red-500 mx-auto mb-4 animate-pulse" />
          <div className="text-white text-lg">Loading...</div>
          <div className="text-gray-400 text-sm mt-2">Checking authentication status</div>
        </div>
      </div>
    );
  }

  // Handle joined consultation view (accessible without login)
  if (joinedConsultation) {
    return (
      <>
        <ConsultationThread
          consultation={joinedConsultation}
          currentUser={
            userProfile || {
              id: "guest",
              name: "Guest",
              email: "",
              role: "specialist",
              isApproved: true,
              availabilityStatus: "available",
            }
          }
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

  // Show join consultation form (no login required)
  if (currentView === "join") {
    return (
      <>
        <JoinConsultationForm
          onJoinConsultation={handleJoinConsultation}
          onBack={() => setCurrentView("auth")}
        />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // User not authenticated - show auth forms
  if (!currentUser) {
    return (
      <>
        <UnifiedAuthComponent />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        {/* Join consultation button for non-authenticated users */}
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setCurrentView("join")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-lg"
          >
            Join with Code
          </button>
        </div>
      </>
    );
  }

  // User authenticated but no profile yet
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Stethoscope size={48} className="text-red-500 mx-auto mb-4 animate-pulse" />
          <div className="text-white text-lg">Setting up your profile...</div>
        </div>
      </div>
    );
  }

  // Specialist awaiting approval
  if (userProfile.role === "specialist" && !userProfile.isApproved) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-6 sm:p-8 max-w-md text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
            Awaiting Approval
          </h2>
          <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
            Your specialist account is pending admin approval. You'll receive an
            email once approved.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 sm:px-6 py-2 rounded-lg text-white transition-colors text-sm sm:text-base">
            Logout
          </button>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    );
  }

  // Authenticated user with approved profile - show dashboard
  return (
    <>
      {userProfile.role === "consulting_doctor" ? (
        <ConsultingDoctorDashboard
          user={userProfile}
          connectionStatus={connectionStatus}
          onLogout={handleLogout}
          notImplemented={notImplemented}
        />
      ) : (
        <SpecialistDashboard
          user={userProfile}
          connectionStatus={connectionStatus}
          onLogout={handleLogout}
          notImplemented={notImplemented}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

function App() {
  // Register service worker (your existing logic)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;