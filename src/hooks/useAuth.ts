import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('medconnect_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Invalid stored user data');
        localStorage.removeItem('medconnect_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate login - in real app, this would call API
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      role: 'consulting_doctor',
      isApproved: true,
      availabilityStatus: 'available'
    };
    
    localStorage.setItem('medconnect_user', JSON.stringify(mockUser));
    setUser(mockUser);
    return true;
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    // Simulate registration
    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email!,
      name: userData.name!,
      specialty: userData.specialty,
      role: userData.role || 'consulting_doctor',
      isApproved: userData.role === 'consulting_doctor' ? true : false,
      location: userData.location,
      experience: userData.experience,
      availabilityStatus: 'available'
    };
    
    localStorage.setItem('medconnect_user', JSON.stringify(newUser));
    setUser(newUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('medconnect_user');
    setUser(null);
  };

  return { user, loading, login, register, logout };
};