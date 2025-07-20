// src/components/auth/UnifiedAuthComponent.tsx
import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { SocialAuthButtons } from './SocialAuthButtons'; 
import { useAuth } from './AuthProvider';
import { User, UserRegistration } from '../../types';

type AuthMode = 'login' | 'register' | 'social';

export const UnifiedAuthComponent: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const { login, register, loading } = useAuth();

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const success = await login(email, password);
    if (success) {
      console.log('Login successful!');
    }
    return success;
  };

//   const handleRegister = async (userData: Partial<User>): Promise<boolean> => {
//     const success = await register(userData);
//     if (success) {
//       console.log('Registration successful!');
//     }
//     return success;
//   };
  const handleRegister = async (userData: Partial<UserRegistration>): Promise<boolean> => {
    const success = await register(userData);
    if (success && userData.email && userData.password) {
        // Auto login after registration
        console.log(userData);
        console.log('Auto-login successful!');
    }
    return success;
};


  const handleSwitchToRegister = () => {
    setAuthMode('register');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleSwitchToSocial = () => {
    setAuthMode('social');
  };

  if (authMode === 'register') {
    return (
      <div>
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={handleSwitchToLogin}
          loading={loading}
        />
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleSwitchToSocial}
            className="bg-gray-700 hover:bg-gray-600 text-blue-400 hover:text-blue-300 px-6 py-2 rounded-lg text-sm transition-colors"
          >
            Or use social authentication
          </button>
        </div>
      </div>
    );
  }

  if (authMode === 'social') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Choose Sign In Method</h2>
            <p className="text-gray-400 text-sm">Select your preferred authentication method</p>
          </div>
          
          <SocialAuthButtons />
          
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">or</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSwitchToLogin}
                className="px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Email Login
              </button>
              <button
                onClick={handleSwitchToRegister}
                className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={handleSwitchToRegister}
        loading={loading}
      />
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handleSwitchToSocial}
          className="bg-gray-700 hover:bg-gray-600 text-blue-400 hover:text-blue-300 px-6 py-2 rounded-lg text-sm transition-colors"
        >
          Or use social authentication
        </button>
      </div>
    </div>
  );
};