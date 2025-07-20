import { Mic, Upload, X } from "lucide-react";
import React, { useState } from "react";
import { BASE_URL } from "../../lib/utils";
import { ConnectionStatus, SPECIALTIES } from "../../types";

interface NewConsultationFormProps {
	onSubmit: (data: any) => void;
	onCancel: () => void;
	connectionStatus: ConnectionStatus;
}

export const NewConsultationForm: React.FC<NewConsultationFormProps> = ({
	onSubmit,
	onCancel,
	connectionStatus,
}) => {
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		specialty: "",
		priority: "standard",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			// doctorId should come from auth context; for now, leave as undefined or mock
			const result = await createConsultation(formData);
			console.log("Consultation created. Code:", result.code);
			alert(`Consultation created! Code: ${result.code}`);
			onSubmit(formData);
		} catch (err) {
			console.error("Failed to create consultation", err);
			alert("Failed to create consultation");
		}
	};

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	return (
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6">
			<div className="flex items-center justify-between mb-4 sm:mb-6">
				<h3 className="text-base sm:text-lg font-semibold text-white">
					New Consultation
				</h3>
				<button
					title="cancel"
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
							title="Specialty"
							name="specialty"
							value={formData.specialty}
							onChange={handleChange}
							className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
							required
						>
							<option value="">Select specialty</option>
							{SPECIALTIES.map((s) => (
								<option key={s.value} value={s.value}>
									{s.emoji} {s.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
							Priority
						</label>
						<select
							title="priority"
							name="priority"
							value={formData.priority}
							onChange={handleChange}
							className="w-full px-2 sm:px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<option value="standard">Standard</option>
							<option value="serious">Serious</option>
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
						{connectionStatus?.isOnline
							? "Syncing online"
							: "Will sync when connection available"}
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
					<span className="text-xs text-gray-400 text-center sm:text-left">
						Images compressed for bandwidth
					</span>
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

// Function to create a consultation via API
const createConsultation = async (
	data: {
		title: string;
		description: string;
		specialty: string;
		priority: string;
	},
	doctorId?: string
) => {
	if (!doctorId) doctorId = "10000";
	console.log(data);
	const response = await fetch(`${BASE_URL}/api/consultations`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "http://localhost:3000",
		},
		body: JSON.stringify({ ...data, doctorId }),
	});
	if (!response.ok) {
		throw new Error("Failed to create consultation");
	}
	return response.json();
};
