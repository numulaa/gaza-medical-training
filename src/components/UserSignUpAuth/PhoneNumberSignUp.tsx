import {
	ConfirmationResult,
	RecaptchaVerifier,
	signInWithPhoneNumber,
	User,
	UserCredential,
} from "firebase/auth";
import React, { useState } from "react";
import { auth } from "../../lib/firebase";
import { Button } from "../ui/button";

interface PhoneNumberSignUpProps {
	onSuccess: (user: User) => void;
	onError: (error: Error) => void;
	className?: string;
}

const PhoneNumberSignUp: React.FC<PhoneNumberSignUpProps> = ({
	onSuccess,
	onError,
	className,
}) => {
	const [phoneNumber, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const [confirmationResult, setConfirmationResult] =
		useState<ConfirmationResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const setupRecaptcha = () => {
		if (!window.recaptchaVerifier) {
			window.recaptchaVerifier = new RecaptchaVerifier(
				auth,
				"recaptcha-container",
				{
					size: "invisible",
					callback: () => {},
				}
			);
		}
	};

	const handleSendCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setupRecaptcha();
		try {
			const appVerifier = window.recaptchaVerifier;
			const result = await signInWithPhoneNumber(
				auth,
				phoneNumber,
				appVerifier
			);
			setConfirmationResult(result);
		} catch (error) {
			setError((error as Error).message);
			onError(error as Error);
		}
	};

	const handleVerifyCode = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (!confirmationResult) return;
		try {
			const userCredential: UserCredential =
				await confirmationResult.confirm(verificationCode);
			onSuccess(userCredential.user);
		} catch (error) {
			setError((error as Error).message);
			onError(error as Error);
		}
	};

	return (
		<div className={className}>
			<h1 className="text-base font-semibold text-white mb-2">
				Phone Number Sign In
			</h1>
			{!confirmationResult ? (
				<form onSubmit={handleSendCode} className="space-y-2">
					<input
						type="tel"
						placeholder="+1 555-555-5555"
						className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value)}
						required
					/>
					<Button type="submit" className="w-full">
						Send Verification Code
					</Button>
					<div id="recaptcha-container" />
				</form>
			) : (
				<form onSubmit={handleVerifyCode} className="space-y-2">
					<input
						type="text"
						placeholder="Verification Code"
						className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
						value={verificationCode}
						onChange={(e) => setVerificationCode(e.target.value)}
						required
					/>
					<Button type="submit" className="w-full">
						Verify Code
					</Button>
				</form>
			)}
			{error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
		</div>
	);
};

export default PhoneNumberSignUp;
