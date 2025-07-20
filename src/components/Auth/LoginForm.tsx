import { User } from "firebase/auth";
import { Eye, EyeOff, Phone, Stethoscope } from "lucide-react";
import React, { useRef, useState } from "react";

// Google SVG logo
const GoogleLogo = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		x="0px"
		y="0px"
		width="50"
		height="50"
		viewBox="0 0 48 48"
	>
		<path
			fill="#fbc02d"
			d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
		></path>
		<path
			fill="#e53935"
			d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
		></path>
		<path
			fill="#4caf50"
			d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
		></path>
		<path
			fill="#1565c0"
			d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
		></path>
	</svg>
	// <svg
	// 	width="28"
	// 	height="28"
	// 	viewBox="0 0 48 48"
	// 	fill="none"
	// 	xmlns="http://www.w3.org/2000/svg"
	// >
	// 	<g>
	// 		<path
	// 			d="M44.5 20H24V28.5H36.9C36.1 32.1 32.7 35 28 35C22.5 35 18 30.5 18 25C18 19.5 22.5 15 28 15C30.2 15 32.2 15.8 33.8 17.1L39.1 12.1C36.3 9.7 32.4 8 28 8C17.5 8 9 16.5 9 27C9 37.5 17.5 46 28 46C38.5 46 47 37.5 47 27C47 25.7 46.9 24.4 46.7 23.1L44.5 20Z"
	// 			fill="#4285F4"
	// 		/>
	// 		<path
	// 			d="M6.3 14.1L12.1 18.7C13.9 15.2 17.6 13 22 13C24.2 13 26.3 13.7 28 15.1L33.8 10.1C30.7 7.5 26.6 6 22 6C14.2 6 7.7 10.8 6.3 14.1Z"
	// 			fill="#34A853"
	// 		/>
	// 		<path
	// 			d="M28 46C32.6 46 36.7 44.3 39.8 41.7L34.3 37.1C32.7 38.3 30.7 39 28 39C23.3 39 19.9 36.1 19.1 32.5H9.1V37.1C12.2 41.2 19.5 46 28 46Z"
	// 			fill="#FBBC05"
	// 		/>
	// 		<path
	// 			d="M44.5 20H24V28.5H36.9C36.5 30.3 35.5 32 34.3 33.3L39.8 37.9C42.2 35.7 44.5 32.2 44.5 27C44.5 25.7 44.4 24.4 44.2 23.1L44.5 20Z"
	// 			fill="#EA4335"
	// 		/>
	// 	</g>
	// </svg>
);

interface LoginFormProps {
	onLogin: (email: string, password: string) => Promise<boolean>;
	onSwitchToRegister: () => void;
	loading?: boolean;
	showToast: (
		message: string,
		type?: "info" | "success" | "warning" | "error",
		duration?: number
	) => void;
	GoogleSignIn: React.FC<{
		onSuccess: (user: User) => void;
		onError: (error: Error) => void;
		className?: string;
	}>;
	PhoneSignIn: React.FC<{
		onSuccess: (user: User) => void;
		onError: (error: Error) => void;
		className?: string;
	}>;
}

export const LoginForm: React.FC<LoginFormProps> = ({
	onLogin,
	onSwitchToRegister,
	loading,
	showToast,
	GoogleSignIn,
	PhoneSignIn,
}) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showPhone, setShowPhone] = useState(false);
	const googleBtnRef = useRef<HTMLButtonElement>(null);
	const googleSignInRef = useRef<HTMLDivElement>(null);

	// Handler to trigger Google sign-in
	const handleGoogleSignIn = () => {
		// Find the hidden GoogleSignIn button and click it
		if (googleSignInRef.current) {
			const btn = googleSignInRef.current.querySelector(
				'button, input[type="button"], input[type="submit"]'
			) as HTMLElement | null;
			if (btn) btn.click();
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		await onLogin(email, password);
		setIsLoading(false);
	};

	return (
		<div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
			<div className="w-full max-w-md bg-gray-800 rounded-lg p-8 shadow-lg flex flex-col justify-between min-h-[540px]">
				<div>
					<div className="text-center mb-8">
						<div className="flex justify-center mb-4">
							<Stethoscope size={48} className="text-red-500" />
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">
							MedConnect Emergency
						</h1>
						<p className="text-gray-400 text-sm">
							Secure medical consultations
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Email Address
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
								placeholder="doctor@example.com"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-300 mb-2"
							>
								Password
							</label>
							<div className="relative">
								<input
									type={showPassword ? "text" : "password"}
									id="password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent pr-12"
									placeholder="••••••••"
									required
								/>
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
									aria-label={
										showPassword
											? "Hide password"
											: "Show password"
									}
									title={
										showPassword
											? "Hide password"
											: "Show password"
									}
								>
									{showPassword ? (
										<EyeOff size={20} />
									) : (
										<Eye size={20} />
									)}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading || loading}
							className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
						>
							{isLoading || loading ? "Signing In..." : "Sign In"}
						</button>
					</form>

					{/* Social sign-in section */}
					<div className="mt-6 flex flex-col items-center">
						<span className="text-gray-400 text-sm mb-2">
							or sign in with
						</span>
						<div className="flex gap-4 mb-2">
							<button
								type="button"
								ref={googleBtnRef}
								className="flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-gray-100 border border-gray-300 shadow transition-colors"
								aria-label="Sign in with Google"
								title="Sign in with Google"
								onClick={handleGoogleSignIn}
							>
								<GoogleLogo />
							</button>
							{/* Hidden GoogleSignIn component for programmatic trigger */}
							<div
								ref={googleSignInRef}
								style={{ display: "none" }}
							>
								<GoogleSignIn
									onSuccess={(user: User) => {
										localStorage.setItem(
											"medconnect_user",
											JSON.stringify({
												id: user.uid,
												email: user.email,
												name: user.displayName,
												role: "consulting_doctor",
												isApproved: true,
												availabilityStatus: "available",
											})
										);
										showToast(
											"Successfully signed in with Google",
											"success"
										);
										window.location.reload();
									}}
									onError={(error: Error) =>
										showToast(
											error.message ||
												"Google sign-in failed",
											"error"
										)
									}
									className="hidden"
								/>
							</div>
							<button
								type="button"
								className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white shadow transition-colors"
								aria-label="Sign in with WhatsApp/Phone"
								title="Sign in with WhatsApp/Phone"
								onClick={() => setShowPhone((v) => !v)}
							>
								<Phone size={26} />
							</button>
						</div>
						{/* Show phone sign-in form inline below icons if toggled */}
						{showPhone && (
							<div className="w-full mt-2 animate-fade-in">
								<PhoneSignIn
									onSuccess={(user: User) => {
										localStorage.setItem(
											"medconnect_user",
											JSON.stringify({
												id: user.uid,
												email: user.email,
												name:
													user.displayName ||
													user.phoneNumber,
												role: "consulting_doctor",
												isApproved: true,
												availabilityStatus: "available",
											})
										);
										showToast(
											"Successfully signed in with phone",
											"success"
										);
										window.location.reload();
									}}
									onError={(error: Error) =>
										showToast(
											error.message ||
												"Phone sign-in failed",
											"error"
										)
									}
									className="w-full mt-2"
								/>
							</div>
						)}
					</div>
				</div>

				{/* Bottom links always visible */}
				<div className="mt-8 text-center">
					<button
						onClick={onSwitchToRegister}
						className="text-sm text-red-400 hover:text-red-300 transition-colors"
					>
						Don't have an account? Register here
					</button>
					<div className="mt-3">
						<button
							onClick={() => (window.location.href = "/join")}
							className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
						>
							Join consultation with code
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
