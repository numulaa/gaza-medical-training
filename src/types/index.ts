export interface User {
	id: string;
	email: string;
	name: string;
	specialty?: string;
	role: "consulting_doctor" | "specialist" | "admin";
	isApproved: boolean;
	location?: string;
	experience?: string;
	availabilityStatus: "available" | "busy" | "offline";
	whatsappNo?: string;
	medicalLicenseNo?: string;
}

export interface Consultation {
	id: string;
	title: string;
	description: string;
	specialty: string;
	priority: "emergency" | "serious" | "standard";
	status: "open" | "in_progress" | "resolved" | "closed";
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	responses: Response[];
	isOffline?: boolean;
	source?: "web" | "whatsapp" | "mobile";
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
	source?: keyof typeof sourceEnum;
}

export interface ConnectionStatus {
	isOnline: boolean;
	speed: "fast" | "slow" | "offline";
	dataUsed: number;
	batteryLevel?: number;
}

export const SPECIALTIES = [
	{ value: "Emergency Medicine", label: "Emergency Medicine", emoji: "🚑" },
	{ value: "Trauma Surgery", label: "Trauma Surgery", emoji: "🩺" },
	{ value: "Cardiology", label: "Cardiology", emoji: "❤️" },
	{ value: "Neurology", label: "Neurology", emoji: "🧠" },
	{ value: "Pediatrics", label: "Pediatrics", emoji: "🧒" },
	{ value: "Internal Medicine", label: "Internal Medicine", emoji: "🏥" },
	{ value: "Anesthesiology", label: "Anesthesiology", emoji: "💉" },
	{ value: "Radiology", label: "Radiology", emoji: "🩻" },
	{ value: "Infectious Disease", label: "Infectious Disease", emoji: "🦠" },
	{ value: "Critical Care", label: "Critical Care", emoji: "🚨" },
	{ value: "Surgery", label: "Surgery", emoji: "🔪" },
	{ value: "General Medicine", label: "General Medicine", emoji: "👨‍⚕️" },
];
export const sourceEnum = {
	web: "web",
	whatsapp: "whatsapp",

	mobile: "mobile",
};
