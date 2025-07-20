// src/components/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { User, UserRegistration } from '../../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<UserRegistration>) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Try to get user profile from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as User);
          } else {
            // Create a basic profile if it doesn't exist (for Google/Phone auth)
            const basicProfile: User = {
              id: user.uid,
              name: user.displayName || '',
              email: user.email || '',
              role: 'consulting_doctor',
              specialty: '',
              location: '',
              experience: '', 
              isApproved: true,
              availabilityStatus: 'available'
            };
            await setDoc(doc(db, 'users', user.uid), basicProfile);
            setUserProfile(basicProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      alert(error.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData: Partial<UserRegistration>): Promise<boolean> => {
    try {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');

      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Update Firebase Auth profile
      if (userData.name) {
        await updateProfile(userCredential.user, {
          displayName: userData.name
        });
      }

      // Save additional user data to Firestore (excluding password)
      const { password, ...userDataWithoutPassword } = userData;
      
      // Create user document with only defined values
      const userDoc: Partial<User> = {
        id: userCredential.user.uid,
        name: userDataWithoutPassword.name || '',
        email: userDataWithoutPassword.email!,
        role: userDataWithoutPassword.role || 'consulting_doctor',
        specialty: userDataWithoutPassword.specialty || '',
        location: userDataWithoutPassword.location || '',
        experience: userDataWithoutPassword.experience || '',
        isApproved: userDataWithoutPassword.role === 'consulting_doctor' ? true : false,
        availabilityStatus: userDataWithoutPassword.availabilityStatus || 'available'
      };

      // Only add optional fields if they have actual values
      if (userDataWithoutPassword.whatsappNo && userDataWithoutPassword.whatsappNo.trim() !== '') {
        userDoc.whatsappNo = userDataWithoutPassword.whatsappNo;
      }
      
      if (userDataWithoutPassword.medicalLicenseNo && userDataWithoutPassword.medicalLicenseNo.trim() !== '') {
        userDoc.medicalLicenseNo = userDataWithoutPassword.medicalLicenseNo;
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        alert('This email is already registered. Please use a different email or try logging in.');
      } else if (error.code === 'auth/weak-password') {
        alert('Password is too weak. Please choose a stronger password (at least 6 characters).');
      } else if (error.code === 'auth/invalid-email') {
        alert('Please enter a valid email address.');
      } else {
        alert(error.message || 'Registration failed. Please try again.');
      }
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};