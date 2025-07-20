import {
	CheckCircle,
	MessageCircle,
	Stethoscope,
	UserPlus,
} from "lucide-react";
import React from "react";

interface LandingPageProps {
	onGetStarted: () => void;
}

const steps = [
	{
		icon: <UserPlus size={32} className="text-red-500" />,
		title: "Ask for Help",
		desc: "Field doctors submit urgent cases from anywhere, even with low connectivity.",
	},
	{
		icon: <MessageCircle size={32} className="text-green-500" />,
		title: "Connect Instantly",
		desc: "Specialists worldwide join the case in real-time, offering critical advice.",
	},
	{
		icon: <CheckCircle size={32} className="text-blue-500" />,
		title: "Resolve & Save Lives",
		desc: "Get actionable recommendations fast, document outcomes, and close the loop.",
	},
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
			{/* Subtle background pattern */}
			<div
				className="absolute inset-0 pointer-events-none opacity-20"
				aria-hidden
			>
				<svg width="100%" height="100%" className="w-full h-full">
					<defs>
						<pattern
							id="dots"
							x="0"
							y="0"
							width="20"
							height="20"
							patternUnits="userSpaceOnUse"
						>
							<circle cx="1" cy="1" r="1" fill="#fff" />
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#dots)" />
				</svg>
			</div>
			<main className="z-10 w-full max-w-2xl mx-auto px-4 py-12 flex flex-col items-center">
				<div className="flex items-center gap-3 mb-6">
					<Stethoscope size={40} className="text-red-500" />
					<h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
						MedConnect{" "}
						<span className="text-red-500">Emergency</span>
					</h1>
				</div>
				<p className="text-lg sm:text-xl text-gray-200 text-center max-w-xl mb-8">
					Emergency medical consultations for war zones and
					low-connectivity environments. Connect field doctors with
					global specialists in seconds—when every moment counts.
				</p>
				<button
					onClick={onGetStarted}
					className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow-lg transition-colors mb-10 focus:outline-none focus:ring-2 focus:ring-red-400"
				>
					Get Started
				</button>
				<div className="w-full bg-gray-800/80 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
					{steps.map((step, i) => (
						<div
							key={i}
							className="flex-1 flex flex-col items-center text-center"
						>
							<div className="mb-3">{step.icon}</div>
							<h3 className="text-lg font-bold text-white mb-1">
								{step.title}
							</h3>
							<p className="text-gray-300 text-sm">{step.desc}</p>
						</div>
					))}
				</div>
				<div className="mt-10 text-gray-500 text-xs text-center max-w-md">
					&copy; {new Date().getFullYear()} MedConnect Emergency.
					Built for resilience, hope, and saving lives.
				</div>
			</main>
		</div>
	);
};

export default LandingPage;
