import React, { useState } from 'react';
import { X, Upload, Mic } from 'lucide-react';
import { ConnectionStatus } from '../../types';

interface NewConsultationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  connectionStatus: ConnectionStatus;
}

export const NewConsultationForm: React.FC<NewConsultationFormProps> = ({ onSubmit, onCancel, connectionStatus }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    specialty: '',
    priority: 'standard'
  });

  const specialties = [
    'Emergency Medicine',
    'Trauma Surgery',
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Internal Medicine',
    'Anesthesiology',
    'Radiology',
    'Infectious Disease',
    'Critical Care'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-white">New Consultation</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Specialty
            </label>
            <select
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            >
              <option value="">Select specialty</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="standard">Standard</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Case Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of the case"
            className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
            Detailed Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Patient details, symptoms, vitals, current treatment, specific questions..."
            className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            {connectionStatus?.isOnline ? 'Syncing online' : 'Will sync when connection available'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
          >
            <Upload size={14} />
            Add Image
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm transition-colors"
          >
            <Mic size={14} />
            Voice Note
          </button>
          <span className="text-xs text-gray-400 text-center sm:text-left">Images compressed for bandwidth</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Submit Consultation
          </button>
          <div className="text-xs text-gray-400 text-center sm:text-left">
            <p>Access code will be generated for sharing</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};