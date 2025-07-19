/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertCircle, Clock, Hash, LogOut, Plus, User } from "lucide-react";
import React, { useState } from "react";
import {
	ConnectionStatus as ConnectionStatusType,
	Consultation,
	User as UserType,
} from "../../types";
import { ConnectionStatus } from "../ConnectionStatus";
import { ConsultationThread } from "../Consultation/ConsultationThread";
import { NewConsultationForm } from "./NewConsultationForm";

interface ConsultingDoctorDashboardProps {
	user: UserType;
	connectionStatus: ConnectionStatusType;
	onLogout: () => void;
	notImplemented: (feature: string) => void;
}

export const ConsultingDoctorDashboard: React.FC<
	ConsultingDoctorDashboardProps
> = ({ user, connectionStatus, onLogout, notImplemented }) => {
	const [showNewConsultation, setShowNewConsultation] = useState(false);
	const [selectedConsultation, setSelectedConsultation] =
		useState<Consultation | null>(null);
	const [activeTab, setActiveTab] = useState<"my_questions" | "received">(
		"my_questions"
	);
	const [joinCode, setJoinCode] = useState("");
	const [sortBy, setSortBy] = useState<
		"date" | "priority" | "specialty" | "responses"
	>("date");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [filterPriority, setFilterPriority] = useState<
		"all" | "emergency" | "urgent" | "standard"
	>("all");
	const [filterSpecialty, setFilterSpecialty] = useState<string>("all");
	const [filterStatus, setFilterStatus] = useState<
		"all" | "open" | "in_progress" | "resolved"
	>("all");
	const [consultations] = useState<Consultation[]>([
		{
			id: "1",
			title: "Chest trauma - 23M soldier",
			description:
				"Shrapnel wound to chest, difficulty breathing, BP 90/60",
			specialty: "Trauma Surgery",
			priority: "emergency",
			status: "open",
			createdBy: user.id,
			createdByName: user.name,
			createdAt: new Date(Date.now() - 5 * 60 * 1000),
			updatedAt: new Date(),
			responses: [],
			source: "web",
		},
		{
			id: "2",
			title: "Pediatric fever - 5yr old",
			description: "High fever 39.5°C, no obvious infection source",
			specialty: "Pediatrics",
			priority: "urgent",
			status: "in_progress",
			createdBy: user.id,
			createdByName: user.name,
			createdAt: new Date(Date.now() - 30 * 60 * 1000),
			updatedAt: new Date(),
			responses: [
				{
					id: "1",
					consultationId: "2",
					userId: "spec1",
					userName: "Dr. Smith",
					content:
						"Please check CBC and blood culture. Monitor for signs of dehydration.",
					createdAt: new Date(Date.now() - 10 * 60 * 1000),
					source: "web",
				},
			],
			source: "whatsapp",
		},
		{
			id: "3",
			title: "Cardiac consultation needed",
			description:
				"Patient with chest pain and irregular heartbeat, need cardiology input",
			specialty: "Cardiology",
			priority: "urgent",
			status: "open",
			createdBy: "other_doctor_1",
			createdByName: "Dr. Hassan",
			createdAt: new Date(Date.now() - 45 * 60 * 1000),
			updatedAt: new Date(),
			responses: [],
			source: "whatsapp",
		},
		{
			id: "4",
			title: "Surgical opinion required",
			description:
				"Abdominal trauma, possible internal bleeding, need surgical assessment",
			specialty: "Surgery",
			priority: "emergency",
			status: "in_progress",
			createdBy: "other_doctor_2",
			createdByName: "Dr. Fatima",
			createdAt: new Date(Date.now() - 20 * 60 * 1000),
			updatedAt: new Date(),
			responses: [
				{
					id: "2",
					consultationId: "4",
					userId: user.id,
					userName: user.name,
					content:
						"Based on description, recommend immediate surgical exploration. Prepare for emergency laparotomy.",
					createdAt: new Date(Date.now() - 5 * 60 * 1000),
					source: "web",
				},
			],
			source: "web",
		},
	]);

	// Separate consultations by type
	const myQuestions = consultations.filter((c) => c.createdBy === user.id);
	const receivedConsultations = consultations.filter(
		(c) => c.createdBy !== user.id
	);

	// Get unique specialties for filter dropdown
	const allSpecialties = [...new Set(consultations.map((c) => c.specialty))];

	// Apply filters and sorting
	const applyFiltersAndSort = (consultationList: Consultation[]) => {
		let filtered = consultationList;

		// Apply filters
		if (filterPriority !== "all") {
			filtered = filtered.filter((c) => c.priority === filterPriority);
		}
		if (filterSpecialty !== "all") {
			filtered = filtered.filter((c) => c.specialty === filterSpecialty);
		}
		if (filterStatus !== "all") {
			filtered = filtered.filter((c) => c.status === filterStatus);
		}

		// Apply sorting
		filtered.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "date":
					comparison = a.createdAt.getTime() - b.createdAt.getTime();
					break;
				case "priority": {
					const priorityOrder = {
						emergency: 0,
						urgent: 1,
						standard: 2,
					};
					comparison =
						priorityOrder[
							a.priority as keyof typeof priorityOrder
						] -
						priorityOrder[b.priority as keyof typeof priorityOrder];
					break;
				}
				case "specialty":
					comparison = a.specialty.localeCompare(b.specialty);
					break;
				case "responses":
					comparison = a.responses.length - b.responses.length;
					break;
			}

			return sortOrder === "desc" ? -comparison : comparison;
		});

		return filtered;
	};

	const filteredMyQuestions = applyFiltersAndSort(myQuestions);
	const filteredReceivedConsultations = applyFiltersAndSort(
		receivedConsultations
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

	const formatTimeAgo = (date: Date) => {
		const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes} min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr ago`;
		return `${Math.floor(hours / 24)} days ago`;
	};

	const formatJoinCode = (value: string) => {
		const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
		return cleaned.replace(/(.{3})/g, "$1-").replace(/-$/, "");
	};

	const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatJoinCode(e.target.value);
		if (formatted.replace(/-/g, "").length <= 9) {
			setJoinCode(formatted);
		}
	};

	const handleJoinConsultation = () => {
		if (joinCode.trim()) {
			notImplemented(`Join consultation with code: ${joinCode}`);
			setJoinCode("");
		}
	};

	const handleSendResponse = async (content: string) => {
		// Simulate sending response
		notImplemented("Send Response");
	};

	const handleMarkResolved = () => {
		notImplemented("Mark Consultation as Resolved");
	};

	const renderConsultationCard = (
		consultation: Consultation,
		isMyQuestion: boolean
	) => (
		<div
			key={consultation.id}
			className={`bg-gray-800 border rounded-lg p-4 ${getPriorityColor(
				consultation.priority
			)}`}
		>
			<div className="flex items-start justify-between mb-2">
				<div className="flex items-center gap-2">
					<span>{getPriorityIcon(consultation.priority)}</span>
					<span className="text-sm font-medium">
						{consultation.specialty}
					</span>
					{!isMyQuestion && (
						<span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
							From: {consultation.createdByName}
						</span>
					)}
				</div>
				<div className="flex items-center gap-2 text-xs text-gray-400">
					<Clock size={12} />
					{formatTimeAgo(consultation.createdAt)}
				</div>
			</div>

			<h4 className="font-medium text-white mb-1">
				{consultation.title}
			</h4>
			<p className="text-gray-300 text-sm mb-3">
				{consultation.description}
			</p>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4 text-xs">
					<span
						className={`px-2 py-1 rounded ${
							consultation.status === "open"
								? "bg-blue-900/20 text-blue-400"
								: consultation.status === "in_progress"
								? "bg-yellow-900/20 text-yellow-400"
								: "bg-green-900/20 text-green-400"
						}`}
					>
						{consultation.status.replace("_", " ")}
					</span>
					{consultation.responses.length > 0 && (
						<span className="text-gray-400">
							{consultation.responses.length} response
							{consultation.responses.length !== 1 ? "s" : ""}
						</span>
					)}
				</div>
				<button
					onClick={() => setSelectedConsultation(consultation)}
					className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
				>
					{isMyQuestion ? "View Responses" : "Respond"} →
				</button>
			</div>
		</div>
	);

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
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<User className="text-red-500" size={24} />
						<div>
							<h1 className="text-lg font-semibold">
								Dr. {user.name}
							</h1>
							<p className="text-sm text-gray-400">
								{user.specialty || "Consulting Doctor"}
							</p>
						</div>
						<div className="ml-6">
							<ConnectionStatus status={connectionStatus} />
						</div>
					</div>

					<div className="flex items-center gap-3">
						{/* Join Code Input */}
						<div className="flex items-center gap-2">
							<div className="relative">
								<Hash
									className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
									size={14}
								/>
								<input
									type="text"
									value={joinCode}
									onChange={handleJoinCodeChange}
									placeholder="Enter code"
									className="w-32 pl-7 pr-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
									aria-label="Consultation join code"
								/>
							</div>
							<button
								onClick={handleJoinConsultation}
								disabled={!joinCode.trim()}
								className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
								aria-label="Join consultation"
							>
								Join
							</button>
						</div>

						{/* Consult Specialist Button */}
						<button
							onClick={() => setShowNewConsultation(true)}
							className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
							aria-label="Consult a Specialist"
						>
							<Plus size={14} />
							Consult a Specialist
						</button>

						{/* Logout Button */}
						<button
							onClick={onLogout}
							className="flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-white transition-colors"
							aria-label="Logout"
						>
							<LogOut size={16} />
							<span className="text-sm">Logout</span>
						</button>
					</div>
				</div>
			</div>

			<div className="p-4 space-y-6">
				{/* New Consultation Form */}
				{showNewConsultation && (
					<div className="mb-4">
						<NewConsultationForm
							onSubmit={(data) => {
								notImplemented("Submit Consultation");
								setShowNewConsultation(false);
							}}
							onCancel={() => setShowNewConsultation(false)}
							connectionStatus={connectionStatus}
						/>
					</div>
				)}

				{/* Consultation Tabs */}
				<div className="space-y-4">
					{/* Tab Navigation */}
					<div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
						<button
							onClick={() => setActiveTab("my_questions")}
							className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								activeTab === "my_questions"
									? "bg-red-600 text-white"
									: "text-gray-400 hover:text-white"
							}`}
						>
							Questions Asked ({myQuestions.length})
						</button>
						<button
							onClick={() => setActiveTab("received")}
							className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
								activeTab === "received"
									? "bg-red-600 text-white"
									: "text-gray-400 hover:text-white"
							}`}
						>
							Questions Received ({receivedConsultations.length})
						</button>
					</div>

					{/* Filters and Sorting */}
					<div className="bg-gray-800 rounded-lg p-4 space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium text-gray-300">
								Filter & Sort
							</h4>
							<button
								onClick={() => {
									setFilterPriority("all");
									setFilterSpecialty("all");
									setFilterStatus("all");
									setSortBy("date");
									setSortOrder("desc");
								}}
								className="text-xs text-red-400 hover:text-red-300 transition-colors"
							>
								Clear All
							</button>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
							{/* Sort By */}
							<div>
								<label className="block text-xs text-gray-400 mb-1">
									Sort By
								</label>
								<select
									id="sortBy"
									value={sortBy}
									onChange={(e) =>
										setSortBy(e.target.value as any)
									}
									className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
									aria-label="Sort consultations by"
								>
									<option value="date">Date</option>
									<option value="priority">Priority</option>
									<option value="specialty">Specialty</option>
									<option value="responses">Responses</option>
								</select>
							</div>

							{/* Sort Order */}
							<div>
								<label className="block text-xs text-gray-400 mb-1">
									Order
								</label>
								<select
									title="sort"
									value={sortOrder}
									onChange={(e) =>
										setSortOrder(e.target.value as any)
									}
									className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
								>
									<option value="desc">Newest First</option>
									<option value="asc">Oldest First</option>
								</select>
							</div>

							{/* Priority Filter */}
							<div>
								<label className="block text-xs text-gray-400 mb-1">
									Priority
								</label>
								<select
									title="filter"
									value={filterPriority}
									onChange={(e) =>
										setFilterPriority(e.target.value as any)
									}
									className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
								>
									<option value="all">All Priorities</option>
									<option value="emergency">
										🔴 Emergency
									</option>
									<option value="urgent">🟡 Urgent</option>
									<option value="standard">
										🟢 Standard
									</option>
								</select>
							</div>

							{/* Specialty Filter */}
							<div>
								<label className="block text-xs text-gray-400 mb-1">
									Specialty
								</label>
								<select
									title="specialityFilter"
									value={filterSpecialty}
									onChange={(e) =>
										setFilterSpecialty(e.target.value)
									}
									className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
								>
									<option value="all">All Specialties</option>
									{allSpecialties.map((specialty) => (
										<option
											key={specialty}
											value={specialty}
										>
											{specialty}
										</option>
									))}
								</select>
							</div>

							{/* Status Filter */}
							<div>
								<label className="block text-xs text-gray-400 mb-1">
									Status
								</label>
								<select
									title="statusFilter"
									value={filterStatus}
									onChange={(e) =>
										setFilterStatus(e.target.value as any)
									}
									className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
								>
									<option value="all">All Status</option>
									<option value="open">Open</option>
									<option value="in_progress">
										In Progress
									</option>
									<option value="resolved">Resolved</option>
								</select>
							</div>
						</div>

						{/* Results Count */}
						<div className="text-xs text-gray-400">
							Showing{" "}
							{activeTab === "my_questions"
								? filteredMyQuestions.length
								: filteredReceivedConsultations.length}{" "}
							of{" "}
							{activeTab === "my_questions"
								? myQuestions.length
								: receivedConsultations.length}{" "}
							consultations
						</div>
					</div>

					{/* Tab Content */}
					{activeTab === "my_questions" && (
						<div className="space-y-4">
							{filteredMyQuestions.length === 0 ? (
								<div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
									<p className="text-gray-400">
										{myQuestions.length === 0
											? "You haven't asked any questions yet."
											: "No consultations match your current filters."}
									</p>
									{myQuestions.length === 0 && (
										<button
											onClick={() =>
												setShowNewConsultation(true)
											}
											className="mt-3 text-red-400 hover:text-red-300 text-sm font-medium"
										>
											Ask your first question →
										</button>
									)}
								</div>
							) : (
								filteredMyQuestions.map((consultation) =>
									renderConsultationCard(consultation, true)
								)
							)}
						</div>
					)}

					{activeTab === "received" && (
						<div className="space-y-4">
							{filteredReceivedConsultations.length === 0 ? (
								<div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
									<p className="text-gray-400">
										{receivedConsultations.length === 0
											? "No questions received via code or link yet."
											: "No consultations match your current filters."}
									</p>
									{receivedConsultations.length === 0 && (
										<p className="text-sm text-gray-500 mt-2">
											Questions you join with codes or
											links will appear here.
										</p>
									)}
								</div>
							) : (
								filteredReceivedConsultations.map(
									(consultation) =>
										renderConsultationCard(
											consultation,
											false
										)
								)
							)}
						</div>
					)}
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-2 gap-4">
					<button
						onClick={() => notImplemented("View Specialists")}
						className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-left transition-colors"
					>
						<div className="flex items-center gap-3 mb-2">
							<User className="text-blue-400" size={20} />
							<span className="font-medium">
								Available Specialists
							</span>
						</div>
						<p className="text-sm text-gray-400">
							View online specialists by specialty
						</p>
					</button>

					<button
						onClick={() => notImplemented("Medical Resources")}
						className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg p-4 text-left transition-colors"
					>
						<div className="flex items-center gap-3 mb-2">
							<AlertCircle className="text-green-400" size={20} />
							<span className="font-medium">
								Medical Resources
							</span>
						</div>
						<p className="text-sm text-gray-400">
							Emergency protocols and references
						</p>
					</button>
				</div>
			</div>
		</div>
	);
};
