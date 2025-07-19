/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	LogOut,
	MessageSquare,
	User,
} from "lucide-react";
import React, { useState } from "react";
import {
	ConnectionStatus as ConnectionStatusType,
	Consultation,
	User as UserType,
} from "../../types";
import { ConnectionStatus } from "../ConnectionStatus";
import { ConsultationThread } from "../Consultation/ConsultationThread";

interface SpecialistDashboardProps {
	user: UserType;
	connectionStatus: ConnectionStatusType;
	onLogout: () => void;
	notImplemented: (feature: string) => void;
}

export const SpecialistDashboard: React.FC<SpecialistDashboardProps> = ({
	user,
	connectionStatus,
	onLogout,
	notImplemented,
}) => {
	const [availabilityStatus, setAvailabilityStatus] = useState<
		"available" | "busy" | "offline"
	>("available");
	const [selectedConsultation, setSelectedConsultation] =
		useState<Consultation | null>(null);
	const [consultations] = useState<Consultation[]>([
		{
			id: "1",
			title: "Chest trauma - 23M soldier",
			description:
				"Shrapnel wound to chest, difficulty breathing, BP 90/60. Patient conscious but in distress.",
			specialty: "Trauma Surgery",
			priority: "emergency",
			status: "open",
			createdBy: "field_doc_1",
			createdByName: "Dr. Ahmad",
			createdAt: new Date(Date.now() - 2 * 60 * 1000),
			updatedAt: new Date(),
			responses: [],
			source: "whatsapp",
		},
		{
			id: "2",
			title: "Pediatric fever - 5yr old",
			description:
				"High fever 39.5°C for 2 days, no obvious infection source, mild dehydration",
			specialty: "Pediatrics",
			priority: "urgent",
			status: "in_progress",
			createdBy: "field_doc_2",
			createdByName: "Dr. Sarah",
			createdAt: new Date(Date.now() - 15 * 60 * 1000),
			updatedAt: new Date(Date.now() - 5 * 60 * 1000),
			responses: [
				{
					id: "1",
					consultationId: "2",
					userId: user.id,
					userName: user.name,
					content:
						"Please check CBC and blood culture. Monitor for signs of dehydration and consider IV fluids if oral intake is poor.",
					createdAt: new Date(Date.now() - 3 * 60 * 1000),
					source: "web",
				},
			],
			source: "web",
		},
		{
			id: "3",
			title: "Cardiac arrhythmia - 45F",
			description:
				"Irregular heartbeat, chest pain, history of hypertension",
			specialty: "Cardiology",
			priority: "standard",
			status: "resolved",
			createdBy: "field_doc_3",
			createdByName: "Dr. Maria",
			createdAt: new Date(Date.now() - 60 * 60 * 1000),
			updatedAt: new Date(Date.now() - 30 * 60 * 1000),
			responses: [
				{
					id: "2",
					consultationId: "3",
					userId: user.id,
					userName: user.name,
					content:
						"Start metoprolol 25mg BID. Monitor BP and heart rate. If symptoms persist, consider ECG.",
					createdAt: new Date(Date.now() - 45 * 60 * 1000),
					source: "web",
				},
				{
					id: "3",
					consultationId: "3",
					userId: "field_doc_3",
					userName: "Dr. Maria",
					content:
						"Thank you, treatment initiated. Patient stable, HR normalized.",
					createdAt: new Date(Date.now() - 30 * 60 * 1000),
					source: "whatsapp",
				},
			],
			source: "web",
		},
	]);

	const filteredConsultations = consultations.filter(
		(c) =>
			c.specialty === user.specialty ||
			user.specialty === "General Medicine"
	);

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "emergency":
				return "text-red-400 bg-red-900/20 border-red-500/30";
			case "urgent":
				return "text-yellow-400 bg-yellow-900/20 border-yellow-500/30";
			default:
				return "text-green-400 bg-green-900/20 border-green-500/30";
		}
	};

	const getPriorityIcon = (priority: string) => {
		return priority === "emergency"
			? "🔴"
			: priority === "urgent"
			? "🟡"
			: "🟢";
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "open":
				return "bg-blue-900/20 text-blue-400";
			case "in_progress":
				return "bg-yellow-900/20 text-yellow-400";
			case "resolved":
				return "bg-green-900/20 text-green-400";
			default:
				return "bg-gray-900/20 text-gray-400";
		}
	};

	const formatTimeAgo = (date: Date) => {
		const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes} min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr ago`;
		return `${Math.floor(hours / 24)} days ago`;
	};

	const getAvailabilityColor = () => {
		switch (availabilityStatus) {
			case "available":
				return "bg-green-600";
			case "busy":
				return "bg-yellow-600";
			case "offline":
				return "bg-gray-600";
		}
	};

	const handleSendResponse = async (content: string) => {
		// Simulate sending response
		notImplemented("Send Response");
	};

	const handleMarkResolved = () => {
		notImplemented("Mark Consultation as Resolved");
	};

	if (selectedConsultation) {
		return (
			<ConsultationThread
				consultation={selectedConsultation}
				currentUser={user}
				connectionStatus={connectionStatus}
				onBack={() => setSelectedConsultation(null)}
				onSendResponse={handleSendResponse}
				onMarkResolved={handleMarkResolved}
				notImplemented={notImplemented}
			/>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white">
			{/* Header */}
			<div className="bg-gray-800 border-b border-gray-700 p-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<div className="relative">
							<User className="text-red-500" size={24} />
							<div
								className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getAvailabilityColor()}`}
							></div>
						</div>
						<div>
							<h1 className="text-lg font-semibold">
								Dr. {user.name}
							</h1>
							<p className="text-sm text-gray-400">
								{user.specialty} Specialist
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<select
							title="availability"
							value={availabilityStatus}
							onChange={(e) =>
								setAvailabilityStatus(e.target.value as any)
							}
							className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<option value="available">Available</option>
							<option value="busy">Busy</option>
							<option value="offline">Offline</option>
						</select>
						<button
							onClick={onLogout}
							className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors"
						>
							<LogOut size={18} />
							Logout
						</button>
					</div>
				</div>
				<ConnectionStatus status={connectionStatus} />
			</div>

			<div className="p-4 space-y-6">
				{/* Notifications */}
				<div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
					<div className="flex items-center gap-2 mb-2">
						<MessageSquare className="text-blue-400" size={20} />
						<span className="font-medium text-blue-400">
							Notifications: 3 new consultations
						</span>
					</div>
					<p className="text-sm text-gray-300">
						{connectionStatus.isOnline
							? "Real-time sync active"
							: "Offline mode - will sync when connected"}
					</p>
				</div>

				{/* Active Consultations Summary */}
				<div className="grid grid-cols-3 gap-4">
					<div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-red-400 mb-1">
							{
								filteredConsultations.filter(
									(c) =>
										c.priority === "emergency" &&
										c.status !== "resolved"
								).length
							}
						</div>
						<div className="text-sm text-red-300">Emergency</div>
					</div>
					<div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-yellow-400 mb-1">
							{
								filteredConsultations.filter(
									(c) =>
										c.priority === "urgent" &&
										c.status !== "resolved"
								).length
							}
						</div>
						<div className="text-sm text-yellow-300">Urgent</div>
					</div>
					<div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-center">
						<div className="text-2xl font-bold text-green-400 mb-1">
							{
								filteredConsultations.filter(
									(c) => c.status === "resolved"
								).length
							}
						</div>
						<div className="text-sm text-green-300">
							Resolved Today
						</div>
					</div>
				</div>

				{/* Consultation List */}
				<div className="space-y-4">
					<h3 className="text-lg font-semibold text-white flex items-center gap-2">
						<MessageSquare size={20} />
						Active Consultations
					</h3>

					{filteredConsultations
						.sort((a, b) => {
							// Sort by priority (emergency first) then by creation time
							const priorityOrder = {
								emergency: 0,
								urgent: 1,
								standard: 2,
							};
							if (
								priorityOrder[
									a.priority as keyof typeof priorityOrder
								] !==
								priorityOrder[
									b.priority as keyof typeof priorityOrder
								]
							) {
								return (
									priorityOrder[
										a.priority as keyof typeof priorityOrder
									] -
									priorityOrder[
										b.priority as keyof typeof priorityOrder
									]
								);
							}
							return (
								b.createdAt.getTime() - a.createdAt.getTime()
							);
						})
						.map((consultation) => (
							<div
								key={consultation.id}
								className={`bg-gray-800 border rounded-lg p-4 ${getPriorityColor(
									consultation.priority
								)}`}
							>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-2">
										<span>
											{getPriorityIcon(
												consultation.priority
											)}
										</span>
										<span className="text-sm font-medium">
											{consultation.specialty}
										</span>
										<span
											className={`px-2 py-1 rounded text-xs ${getStatusColor(
												consultation.status
											)}`}
										>
											{consultation.status.replace(
												"_",
												" "
											)}
										</span>
									</div>
									<div className="flex items-center gap-2 text-xs text-gray-400">
										<Clock size={12} />
										{formatTimeAgo(consultation.createdAt)}
									</div>
								</div>

								<h4 className="font-medium text-white mb-2">
									{consultation.title}
								</h4>
								<p className="text-gray-300 text-sm mb-4 leading-relaxed">
									{consultation.description}
								</p>

								{consultation.responses.length > 0 && (
									<div className="bg-gray-700/50 rounded p-3 mb-3">
										<div className="text-xs text-gray-400 mb-1">
											Latest Response:
										</div>
										<div className="text-sm text-gray-200">
											"
											{
												consultation.responses[
													consultation.responses
														.length - 1
												].content
											}
											"
										</div>
									</div>
								)}

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4 text-xs">
										{consultation.responses.length > 0 && (
											<span className="text-gray-400">
												{consultation.responses.length}{" "}
												response
												{consultation.responses
													.length !== 1
													? "s"
													: ""}
											</span>
										)}
										{consultation.accessCode && (
											<span className="bg-purple-600 text-white px-2 py-1 rounded">
												Code: {consultation.accessCode}
											</span>
										)}
										{consultation.status !== "resolved" && (
											<span className="text-yellow-400 flex items-center gap-1">
												<AlertTriangle size={12} />
												Awaiting response
											</span>
										)}
									</div>
									<div className="flex items-center gap-2">
										{consultation.status === "resolved" ? (
											<button
												onClick={() =>
													notImplemented(
														"View Resolved Thread"
													)
												}
												className="text-gray-400 hover:text-gray-300 text-sm font-medium transition-colors"
											>
												View Thread
											</button>
										) : (
											<>
												<button
													onClick={() =>
														setSelectedConsultation(
															consultation
														)
													}
													className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
												>
													Respond
												</button>
												<button
													onClick={() =>
														setSelectedConsultation(
															consultation
														)
													}
													className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
												>
													Open Thread →
												</button>
											</>
										)}
									</div>
								</div>
							</div>
						))}
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-2 gap-4">
					<button
						onClick={() => notImplemented("Medical References")}
						className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-left transition-colors"
					>
						<div className="flex items-center gap-3 mb-2">
							<CheckCircle className="text-green-400" size={20} />
							<span className="font-medium">
								Medical References
							</span>
						</div>
						<p className="text-sm text-gray-400">
							Quick access to protocols and guidelines
						</p>
					</button>

					<button
						onClick={() => notImplemented("Case History")}
						className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-left transition-colors"
					>
						<div className="flex items-center gap-3 mb-2">
							<Clock className="text-blue-400" size={20} />
							<span className="font-medium">Case History</span>
						</div>
						<p className="text-sm text-gray-400">
							View your previous consultations
						</p>
					</button>
				</div>
			</div>
		</div>
	);
};
