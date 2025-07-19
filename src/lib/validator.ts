import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  specialty: z.string().optional(),
  role: z.enum(["consulting_doctor", "specialist", "admin"]),
  isApproved: z.boolean(),
  location: z.string().optional(),
  experience: z.string().optional(),
  availabilityStatus: z.enum(["available", "busy", "offline"]),
});

// Define the attachment schema
const AttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string().url(),
});

export const ResponseSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  userId: z.string(),
  userName: z.string(),
  content: z.string(),
  createdAt: z.date(),
  isOffline: z.boolean().optional(),
  source: z.enum(["web", "whatsapp", "mobile"]).optional(),
  attachments: z.array(AttachmentSchema).optional(),
});

// Main Consultation schema
export const ConsultationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  specialty: z.string(),
  priority: z.enum(["emergency", "urgent", "standard"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  responses: z.array(ResponseSchema),
  isOffline: z.boolean().optional(),
  source: z.enum(["web", "whatsapp", "mobile"]).optional(),
  createdByName: z.string().optional(),
  accessCode: z.string().optional(),
  attachments: z.array(AttachmentSchema).optional(),
});
