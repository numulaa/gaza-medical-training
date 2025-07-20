import { useState, useEffect } from 'react';
import { User, UserRegistration } from '../types'; // Adjust path if needed

// Helper to get our mock user database from localStorage
const getUserDatabase = (): { [email: string]: User } => {
  const db = localStorage.getItem('medconnect_user_database');
  return db ? JSON.parse(db) : {};
};

// Helper to save to our mock user database
const saveUserDatabase = (db: { [email: string]: User }) => {
  localStorage.setItem('medconnect_user_database', JSON.stringify(db));
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This part remains the same, checking for an active session
    const storedUser = localStorage.getItem('medconnect_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const db = getUserDatabase();
    const existingUser = db[email];

    // In a real app, you'd also verify the password. Here, we just check if the user exists.
    if (existingUser) {
      // User found! Set them as the currently logged-in user.
      localStorage.setItem('medconnect_user', JSON.stringify(existingUser));
      setUser(existingUser);
      return true;
    }

    // User not found in our "database"
    console.error('Login failed: User not found.');
    return false;
  };

  const register = async (userData: Partial<UserRegistration>): Promise<boolean> => {
    const db = getUserDatabase();
    
    if (!userData.email || !userData.name) {
      console.error("Registration failed: Email and name are required.");
      return false;
    }

    if (db[userData.email]) {
      console.error("Registration failed: User with this email already exists.");
      return false;
    }

    // Create the new user with the role from the registration form
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role || 'consulting_doctor', // Role is taken from form data
      specialty: userData.specialty,
      isApproved: userData.role === 'consulting_doctor' ? true:false, // Specialists need approval
      location: userData.location,
      experience: userData.experience,
      availabilityStatus: 'available',
    };

    // Add the new user to our mock database
    db[newUser.email] = newUser;
    saveUserDatabase(db);
    
    // Set the new user as the currently logged-in user
    localStorage.setItem('medconnect_user', JSON.stringify(newUser));
    setUser(newUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('medconnect_user');
    setUser(null);
  };

  // Return properties that match what App.tsx expects
  return { 
    currentUser: user,
    userProfile: user,
    loading, 
    login, 
    register, 
    logout 
  };
};