import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle,
	Globe,
	Phone,
	Send,
	Smartphone,
	User,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { BASE_URL, getPriorityColor, getPriorityIcon } from "../../lib/utils";
import {
	ConnectionStatus,
	Consultation,
	Response,
	sourceEnum,
	User as UserType,
} from "../../types";

interface ConsultationThreadProps {
	consultation: Consultation;
	currentUser: UserType;
	connectionStatus: ConnectionStatus;
	onBack: () => void;
	onSendResponse: (content: string) => void;
	onMarkResolved: () => void;
	notImplemented: (feature: string) => void;
}

const ConsultationThread: React.FC<ConsultationThreadProps> = ({
	consultation,
	currentUser,
	connectionStatus,
	onBack,
	onSendResponse,
	onMarkResolved,
	notImplemented,
}) => {
	const [newResponse, setNewResponse] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [responses, setResponses] = useState(consultation.responses || []);
	const [status, setStatus] = useState(consultation.status);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [responses]);

	const postReply = async (consultationId: string, reply: any) => {
		const response = await fetch(
			`${BASE_URL}/api/consultations/${consultationId}/replies`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reply),
			}
		);
		if (!response.ok) throw new Error("Failed to post reply");
		return response.json();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newResponse.trim() || isSubmitting) return;
		setIsSubmitting(true);
		const optimisticReply = {
			id: "temp-" + Date.now(),
			userId: currentUser.id,
			consultationId: consultation.id,
			userName: currentUser.name,
			content: newResponse.trim(),
			source: sourceEnum.web as keyof typeof sourceEnum,
			createdAt: new Date(),
			isOffline: false,
		};
		setResponses((prev) => [...prev, optimisticReply]);
		setNewResponse("");
		try {
			const result = await postReply(consultation.id, {
				userId: currentUser.id,
				userName: currentUser.name,
				content: newResponse.trim(),
				source: sourceEnum.web as keyof typeof sourceEnum,
			});
			setResponses((prev) =>
				prev.map((r) =>
					r.id === optimisticReply.id ? result.reply : r
				)
			);
			await onSendResponse(newResponse.trim());
		} catch (err) {
			// Remove optimistic reply on error
			setResponses((prev) =>
				prev.filter((r) => r.id !== optimisticReply.id)
			);
			alert("Failed to send reply");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatTimeAgo = (dateInput: any) => {
		let date: Date;

		if (dateInput instanceof Date) {
			date = dateInput;
		} else if (
			dateInput &&
			typeof dateInput === "object" &&
			typeof dateInput.seconds === "number"
		) {
			// Firestore Timestamp object
			date = new Date(dateInput.seconds * 1000);
		} else if (typeof dateInput === "string") {
			date = new Date(dateInput);
		} else {
			return "Unknown time";
		}

		const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
		if (minutes < 1) return "Just now";
		if (minutes < 60) return `${minutes} min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr ago`;
		return `${Math.floor(hours / 24)} days ago`;
	};

	// const formatTimeAgo = (date: Date) => {
	// 	const now = new Date();
	// 	const diffInMinutes = Math.floor(
	// 		(now.getTime() - date.getTime()) / 60000
	// 	);

	// 	if (diffInMinutes < 1) return "Just now";
	// 	if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

	// 	const diffInHours = Math.floor(diffInMinutes / 60);
	// 	if (diffInHours < 24) return `${diffInHours} hr ago`;

	// 	const diffInDays = Math.floor(diffInHours / 24);
	// 	if (diffInDays < 7)
	// 		return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;

	// 	return date.toLocaleDateString();
	// };

	const getMessageSource = (response: Response) => {
		// Determine if message came from WhatsApp or in-app
		if (response.source === "whatsapp") {
			return { icon: Phone, label: "WhatsApp", color: "text-green-400" };
		}
		if (response.source === "web") {
			return { icon: Globe, label: "Web App", color: "text-blue-400" };
		}
		return {
			icon: Smartphone,
			label: "Mobile App",
			color: "text-purple-400",
		};
	};

	const isCurrentUserMessage = (response: Response) => {
		return response.userId === currentUser.id;
	};

	// Deterministic user color assignment
	const USER_COLORS = [
		"text-blue-400",
		"text-green-400",
		"text-purple-400",
		"text-yellow-400",
		"text-pink-400",
		"text-cyan-400",
		"text-orange-400",
	];
	function getUserColor(userId: string) {
		let hash = 0;
		for (let i = 0; i < userId.length; i++) {
			hash += userId.charCodeAt(i);
		}
		return USER_COLORS[hash % USER_COLORS.length];
	}

	// Always use the latest consultation.responses as the base, but allow optimistic updates
	useEffect(() => {
		setResponses(consultation.responses || []);
	}, [consultation.responses]);

	const canMarkResolved = () => {
		if (status === "resolved") return false;
		if (
			currentUser.id &&
			(consultation as any)?.doctorId &&
			currentUser.id === (consultation as any).doctorId
		)
			return true;
		if (
			consultation.source === "whatsapp" &&
			(currentUser as any)?.whatsappNumber &&
			(consultation as any)?.whatsappNumber &&
			(currentUser as any).whatsappNumber ===
				(consultation as any).whatsappNumber
		)
			return true;
		return false;
	};

	const handleMarkResolved = async () => {
		try {
			const payload: any = { status: "resolved" };
			if (currentUser.id) payload.doctorId = currentUser.id;
			if ((currentUser as any)?.whatsappNumber)
				payload.whatsappNumber = (currentUser as any).whatsappNumber;
			const res = await fetch(
				`${BASE_URL}/api/consultations/${consultation.id}/status`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);
			if (!res.ok) throw new Error("Failed to mark as resolved");
			setStatus("resolved");
		} catch (err) {
			alert("Failed to mark as resolved");
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 text-white flex flex-col">
			{/* Header */}
			<div className="bg-gray-800 border-b border-gray-700 p-4 flex-shrink-0">
				<div className="flex items-center gap-3 mb-4">
					<button
						title="back"
						onClick={onBack}
						className="text-gray-400 hover:text-white transition-colors"
					>
						<ArrowLeft size={20} />
					</button>
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<span>
								{getPriorityIcon(consultation.priority)}
							</span>
							<h1 className="text-lg font-semibold">
								{consultation.title}
							</h1>
							<span
								className={`px-2 py-1 rounded text-xs ${
									status === "open"
										? "bg-blue-900/20 text-blue-400"
										: status === "in_progress"
										? "bg-yellow-900/20 text-yellow-400"
										: status === "resolved"
										? "bg-green-900/20 text-green-400"
										: "bg-gray-900/20 text-gray-400"
								}`}
							>
								{status.replace("_", " ")}
							</span>
						</div>
						<div className="flex items-center gap-4 text-sm text-gray-400">
							<span>{consultation.specialty}</span>
							<span>•</span>
							<span>{formatTimeAgo(consultation.createdAt)}</span>
							<span>•</span>
							<span>{responses?.length} responses</span>
						</div>
					</div>
				</div>

				{/* Connection Status */}
				<div className="flex items-center justify-between text-xs">
					<div className="flex items-center gap-2">
						<div
							className={`w-2 h-2 rounded-full ${
								connectionStatus.isOnline
									? "bg-green-400"
									: "bg-red-400"
							}`}
						></div>
						<span className="text-gray-400">
							{connectionStatus.isOnline ? "Online" : "Offline"} •
							{connectionStatus.isOnline
								? " Real-time sync"
								: " Will sync when connected"}
						</span>
					</div>
					{canMarkResolved() && (
						<button
							onClick={handleMarkResolved}
							className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs transition-colors"
						>
							Mark as Resolved
						</button>
					)}
				</div>
			</div>

			{/* Prompt for marking as resolved */}
			{status !== "resolved" &&
				consultation.createdBy !== currentUser.id && (
					<div className="bg-yellow-900/20 border-l-4 border-yellow-500 text-yellow-300 px-4 py-2 mb-2 rounded flex items-center gap-2">
						<AlertTriangle size={18} className="text-yellow-400" />
						<span>
							Only the doctor who created this case (
							{consultation.createdByName || "the creator"}) can
							mark it as resolved. Please remind them to do so
							when appropriate.
						</span>
					</div>
				)}

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{/* Original Consultation */}
				<div
					className={`border rounded-lg p-4 ${getPriorityColor(
						consultation.priority
					)}`}
				>
					<div className="flex items-start gap-3">
						<div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
							<User size={16} />
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-2">
								<span className="font-medium">
									Dr.{" "}
									{consultation.createdByName ||
										"Field Medic"}
								</span>
								<span className="text-xs text-gray-400">•</span>
								<span className="text-xs text-gray-400">
									{formatTimeAgo(consultation.createdAt)}
								</span>
								<div className="flex items-center gap-1 text-xs">
									{consultation.source === "whatsapp" ? (
										<>
											<Phone
												size={12}
												className="text-green-400"
											/>
											<span className="text-green-400">
												WhatsApp
											</span>
										</>
									) : (
										<>
											<Globe
												size={12}
												className="text-blue-400"
											/>
											<span className="text-blue-400">
												Web App
											</span>
										</>
									)}
								</div>
							</div>
							<div className="bg-gray-800/50 rounded-lg p-3">
								<p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
									{consultation.description}
								</p>
							</div>
							{consultation.attachments &&
								consultation.attachments?.length > 0 && (
									<div className="mt-3 space-y-2">
										{consultation.attachments?.map(
											(attachment, index) => (
												<div
													key={index}
													className="bg-gray-700/50 rounded p-2 text-sm"
												>
													<span className="text-gray-400">
														📎 {attachment.name}
													</span>
													<button
														title="uploadAttachement"
														onClick={() =>
															notImplemented(
																"View Attachment"
															)
														}
														className="ml-2 text-blue-400 hover:text-blue-300"
													>
														View
													</button>
												</div>
											)
										)}
									</div>
								)}
						</div>
					</div>
				</div>

				{/* Responses */}
				{responses?.map((response, index) => {
					const isOwnMessage = isCurrentUserMessage(response);
					const sourceInfo = getMessageSource(response);
					const SourceIcon = sourceInfo.icon;
					const userColor = getUserColor(response.userId);

					return (
						<div
							key={response.id}
							className={`flex ${
								isOwnMessage ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-[80%] ${
									isOwnMessage ? "order-2" : "order-1"
								}`}
							>
								<div className="flex items-center gap-2 mb-1">
									{!isOwnMessage && (
										<div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
											<User size={12} />
										</div>
									)}
									<span
										className={`text-sm font-medium ${userColor}`}
									>
										{isOwnMessage
											? "You"
											: `Dr. ${response.userName}`}
									</span>
									<span className="text-xs text-gray-400">
										•
									</span>
									<span className="text-xs text-gray-400">
										{formatTimeAgo(response.createdAt)}
									</span>
									<div className="flex items-center gap-1">
										<SourceIcon
											size={10}
											className={sourceInfo.color}
										/>
										<span
											className={`text-xs ${sourceInfo.color}`}
										>
											{sourceInfo.label}
										</span>
									</div>
									{response.isOffline && (
										<div className="flex items-center gap-1">
											<AlertTriangle
												size={10}
												className="text-yellow-400"
											/>
											<span className="text-xs text-yellow-400">
												Pending sync
											</span>
										</div>
									)}
								</div>
								<div
									className={`rounded-lg p-3 ${
										isOwnMessage
											? "bg-red-600 text-white"
											: "bg-gray-700 text-gray-200"
									}`}
								>
									<p className="leading-relaxed whitespace-pre-wrap">
										{response.content}
									</p>
								</div>
							</div>
						</div>
					);
				})}

				{/* Typing indicator for real-time */}
				{connectionStatus.isOnline && status === "in_progress" && (
					<div className="flex items-center gap-2 text-gray-400 text-sm">
						<div className="flex space-x-1">
							<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
							<div
								className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
								style={{ animationDelay: "0.1s" }}
							></div>
							<div
								className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
								style={{ animationDelay: "0.2s" }}
							></div>
						</div>
						<span>Other doctors may be typing...</span>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Response Input */}
			{status !== "resolved" && (
				<div className="bg-gray-800 border-t border-gray-700 p-4 flex-shrink-0">
					<form onSubmit={handleSubmit} className="space-y-3">
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
								<User size={16} className="text-white" />
							</div>
							<div className="flex-1">
								<textarea
									value={newResponse}
									onChange={(e) =>
										setNewResponse(e.target.value)
									}
									placeholder={
										currentUser.role === "specialist"
											? "Provide your medical advice and recommendations..."
											: "Ask follow-up questions or provide additional information..."
									}
									className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
									rows={3}
									disabled={isSubmitting}
								/>
								<div className="flex items-center justify-between mt-2">
									<div className="flex items-center gap-4 text-xs text-gray-400">
										<span>
											{connectionStatus.isOnline
												? "Will send immediately"
												: "Will send when connected"}
										</span>
										{!connectionStatus.isOnline && (
											<div className="flex items-center gap-1">
												<AlertTriangle
													size={12}
													className="text-yellow-400"
												/>
												<span className="text-yellow-400">
													Offline mode
												</span>
											</div>
										)}
									</div>
									<div className="flex items-center gap-2">
										<button
											type="button"
											onClick={() =>
												notImplemented("Voice Response")
											}
											className="p-2 text-gray-400 hover:text-white transition-colors"
											title="Voice response"
										>
											🎙️
										</button>
										<button
											type="button"
											onClick={() =>
												notImplemented("Add Attachment")
											}
											className="p-2 text-gray-400 hover:text-white transition-colors"
											title="Add attachment"
										>
											📎
										</button>
										<button
											type="submit"
											disabled={
												!newResponse.trim() ||
												isSubmitting
											}
											className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
										>
											{isSubmitting ? (
												<>
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													Sending...
												</>
											) : (
												<>
													<Send size={16} />
													Send
												</>
											)}
										</button>
									</div>
								</div>
							</div>
						</div>
					</form>

					{/* Quick Response Templates for Specialists */}
					{currentUser.role === "specialist" && (
						<div className="mt-3 flex flex-wrap gap-2">
							<button
								onClick={() =>
									setNewResponse(
										"Please provide more details about the patient's vital signs and current symptoms."
									)
								}
								className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
							>
								Request More Info
							</button>
							<button
								onClick={() =>
									setNewResponse(
										"Based on the symptoms described, I recommend immediate..."
									)
								}
								className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
							>
								Emergency Protocol
							</button>
							<button
								onClick={() =>
									setNewResponse(
										"This appears to be a stable condition. Monitor for..."
									)
								}
								className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
							>
								Monitoring Advice
							</button>
						</div>
					)}
				</div>
			)}

			{/* Resolved Status */}
			{status === "resolved" && (
				<div className="bg-green-900/20 border-t border-green-500/30 p-4 flex items-center justify-center gap-2">
					<CheckCircle className="text-green-400" size={20} />
					<span className="text-green-400 font-medium">
						This consultation has been resolved
					</span>
				</div>
			)}
		</div>
	);
};

export default ConsultationThread;
