// src/components/auth/SocialAuthButtons.tsx
import React, { useState } from 'react';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { Button } from '../ui/button';

export const SocialAuthButtons: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      setError(error.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
        }
      );
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      alert('Verification code sent to your phone!');
    } catch (error: any) {
      console.error('Phone sign-in error:', error);
      setError(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!confirmationResult) {
      setError('No confirmation result available');
      setLoading(false);
      return;
    }

    try {
      await confirmationResult.confirm(verificationCode);
      alert('Phone number verified successfully!');
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium py-3"
      >
        {loading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <Button
        onClick={() => setShowPhoneAuth(!showPhoneAuth)}
        type="button"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
      >
        Continue with Phone Number
      </Button>

      {showPhoneAuth && (
        <div className="mt-4 space-y-4 p-4 bg-gray-700 rounded-lg">
          {!confirmationResult ? (
            <form onSubmit={handlePhoneSignIn} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number (with country code)
                </label>
                <input
                  type="tel"
                  placeholder="+1 555-555-5555"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </form>
          )}
          <div id="recaptcha-container" />
        </div>
      )}

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
};