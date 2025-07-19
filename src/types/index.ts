export interface User {
  id: string;
  email: string;
  name: string;
  specialty?: string;
  role: 'consulting_doctor' | 'specialist' | 'admin';
  isApproved: boolean;
  location?: string;
  experience?: string;
  availabilityStatus: 'available' | 'busy' | 'offline';
}

export interface Consultation {
  id: string;
  title: string;
  description: string;
  specialty: string;
  priority: 'emergency' | 'urgent' | 'standard';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  responses: Response[];
  isOffline?: boolean;
  source?: 'web' | 'whatsapp' | 'mobile';
  createdByName?: string;
  accessCode?: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

export interface Response {
  id: string;
  consultationId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  isOffline?: boolean;
  source?: 'web' | 'whatsapp' | 'mobile';
}

export interface ConnectionStatus {
  isOnline: boolean;
  speed: 'fast' | 'slow' | 'offline';
  dataUsed: number;
  batteryLevel?: number;
}