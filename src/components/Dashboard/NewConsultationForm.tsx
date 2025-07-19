/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mic, Upload, X } from "lucide-react";
import React, { useState } from "react";
import { ConnectionStatus } from "../../types";

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

	const specialties = [
		"Emergency Medicine",
		"Trauma Surgery",
		"Cardiology",
		"Neurology",
		"Pediatrics",
		"Internal Medicine",
		"Anesthesiology",
		"Radiology",
		"Infectious Disease",
		"Critical Care",
	];

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSubmit(formData);
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
		<div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-lg font-semibold text-white">
					New Consultation
				</h3>
				<button
					title="cancelButton"
					onClick={onCancel}
					className="text-gray-400 hover:text-white transition-colors"
				>
					<X size={20} />
				</button>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Specialty
						</label>
						<select
							title="specialty"
							name="specialty"
							value={formData.specialty}
							onChange={handleChange}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
							required
						>
							<option value="">Select specialty</option>
							{specialties.map((specialty) => (
								<option key={specialty} value={specialty}>
									{specialty}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2">
							Priority
						</label>
						<select
							title="priority"
							name="priority"
							value={formData.priority}
							onChange={handleChange}
							className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<option value="standard">Standard</option>
							<option value="urgent">Urgent</option>
							<option value="emergency">Emergency</option>
						</select>
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Case Title
					</label>
					<input
						type="text"
						name="title"
						value={formData.title}
						onChange={handleChange}
						placeholder="Brief description of the case"
						className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2">
						Detailed Description
					</label>
					<textarea
						name="description"
						value={formData.description}
						onChange={handleChange}
						rows={6}
						placeholder="Patient details, symptoms, vitals, current treatment, specific questions..."
						className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
						required
					/>
					<p className="text-xs text-gray-400 mt-1">
						{connectionStatus?.isOnline
							? "Syncing online"
							: "Will sync when connection available"}
					</p>
				</div>

				<div className="flex items-center gap-4 py-2">
					<button
						type="button"
						className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
					>
						<Upload size={16} />
						Add Image
					</button>
					<button
						type="button"
						className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
					>
						<Mic size={16} />
						Voice Note
					</button>
					<span className="text-xs text-gray-400">
						Images compressed for bandwidth
					</span>
				</div>

				<div className="flex items-center gap-3 pt-4">
					<button
						type="submit"
						className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
					>
						Submit Consultation
					</button>
					<div className="text-xs text-gray-400">
						<p>Access code will be generated for sharing</p>
					</div>
					<button
						type="button"
						onClick={onCancel}
						className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};
