import { ArrowLeft, Hash, Stethoscope } from "lucide-react";
import React, { useState } from "react";

interface JoinConsultationFormProps {
	onJoinConsultation: (code: string) => Promise<boolean>;
	onBack: () => void;
	loading?: boolean;
}

export const JoinConsultationForm: React.FC<JoinConsultationFormProps> = ({
	onJoinConsultation,
	onBack,
	loading,
}) => {
	const [code, setCode] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim() || isLoading) return;

		setIsLoading(true);
		setError("");

		try {
			const success = await onJoinConsultation(code.trim().toUpperCase());
			if (!success) {
				setError(
					"Invalid consultation code. Please check and try again."
				);
			}
		} catch (error) {
			console.log(error);
			setError("Failed to join consultation. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const formatCode = (value: string) => {
		// Remove non-alphanumeric characters and convert to uppercase
		const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
		// Add hyphens every 3 characters (ABC-DEF-GHI format)
		return cleaned.replace(/(.{3})/g, "$1-").replace(/-$/, "");
	};

	const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const formatted = formatCode(e.target.value);
		if (formatted.replace(/-/g, "").length <= 9) {
			// Max 9 characters (3 groups of 3)
			setCode(formatted);
		}
	};

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-lg">
				<div className="flex items-center mb-6">
					<button
						title="back"
						onClick={onBack}
						className="text-gray-400 hover:text-white mr-3 transition-colors"
					>
						<ArrowLeft size={20} />
					</button>
					<div className="flex items-center">
						<Stethoscope size={32} className="text-red-500 mr-2" />
						<h1 className="text-xl font-bold text-white">
							Join Consultation
						</h1>
					</div>
				</div>

				<div className="mb-6">
					<p className="text-gray-300 text-sm mb-4">
						Enter the consultation code to join an ongoing medical
						consultation thread.
					</p>
					<div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
						<p className="text-blue-300 text-xs">
							💡 Consultation codes are shared by the consulting
							doctor and allow secure access to specific medical
							cases.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="code"
							className="block text-sm font-medium text-gray-300 mb-2"
						>
							Consultation Code
						</label>
						<div className="relative">
							<Hash
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={20}
							/>
							<input
								type="text"
								id="code"
								value={code}
								onChange={handleCodeChange}
								className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-lg tracking-wider"
								placeholder="ABC-DEF-GHI"
								required
							/>
						</div>
						{error && (
							<p className="mt-2 text-sm text-red-400">{error}</p>
						)}
						<p className="mt-2 text-xs text-gray-400">
							Format: 3 groups of 3 characters (e.g., ABC-DEF-GHI)
						</p>
					</div>

					<button
						type="submit"
						disabled={!code.trim() || isLoading || loading}
						className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
					>
						{isLoading || loading ? (
							<div className="flex items-center justify-center gap-2">
								<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								Joining...
							</div>
						) : (
							"Join Consultation"
						)}
					</button>
				</form>

				<div className="mt-6 space-y-3">
					<div className="border-t border-gray-700 pt-4">
						<h3 className="text-sm font-medium text-gray-300 mb-2">
							How it works:
						</h3>
						<ul className="text-xs text-gray-400 space-y-1">
							<li>
								• Consulting doctors share consultation codes
							</li>
							<li>
								• Specialists use codes to join specific cases
							</li>
							<li>
								• Secure access without browsing all
								consultations
							</li>
							<li>• Works offline once consultation is loaded</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};
