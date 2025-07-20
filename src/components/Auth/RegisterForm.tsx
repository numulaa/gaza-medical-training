import React, { useState } from 'react';
import { Stethoscope, ArrowLeft } from 'lucide-react';
import { User, UserRegistration } from '../../types';

interface RegisterFormProps {
  onRegister: (userData: Partial<UserRegistration>) => Promise<boolean>;
  onSwitchToLogin: () => void;
  loading?: boolean;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'consulting_doctor' as 'consulting_doctor' | 'specialist',
    specialty: '',
    location: '',
    experience: '',
    availabilityStatus: 'available' as 'available' | 'busy' | 'offline',
    whatsappNo: '',
    isApproved: false // This will be set based on role in the backend
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onRegister(formData);
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-lg">
        <div className="flex items-center mb-6">
          <button
            onClick={onSwitchToLogin}
            className="text-gray-400 hover:text-white mr-3"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center">
            <Stethoscope size={32} className="text-red-500 mr-2" />
            <h1 className="text-xl font-bold text-white">Register</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="whatsappNo" className="block text-sm font-medium text-gray-300 mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              id="whatsappNo"
              name="whatsappNo"
              value={formData.whatsappNo}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="consulting_doctor">Consulting Doctor (Field)</option>
              <option value="specialist">Specialist (Remote)</option>
            </select>
          </div>

          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-300 mb-1">
              Medical Specialty
            </label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              placeholder="e.g., Emergency Medicine, Surgery, Cardiology"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-gray-300 mb-1">
              Years of Experience
            </label>
            <input
              type="text"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g., 5 years, 10+ years"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="availabilityStatus" className="block text-sm font-medium text-gray-300 mb-1">
              Initial Availability Status
            </label>
            <select
              id="availabilityStatus"
              name="availabilityStatus"
              value={formData.availabilityStatus}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Information about approval process */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-blue-300 text-xs">
              <strong>Note:</strong> {formData.role === 'specialist' 
                ? 'Specialist accounts require admin approval before activation.' 
                : 'Consulting doctor accounts are automatically approved.'}
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {isLoading || loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};