import { signInWithPopup, User } from "firebase/auth";
import React from "react";
import { auth, googleProvider } from "../../lib/firebase";
import { Button } from "../ui/button";

interface GoogleSignUpProps {
	onSuccess: (user: User) => void;
	onError: (error: Error) => void;
	className?: string;
}

const GoogleSignUp: React.FC<GoogleSignUpProps> = ({
	onSuccess,
	onError,
	className,
}) => {
	const handleGoogleSignIn = async () => {
		try {
			const result = await signInWithPopup(auth, googleProvider);
			onSuccess(result.user);
		} catch (error) {
			onError(error as Error);
		}
	};

	return (
		<Button
			onClick={handleGoogleSignIn}
			className={className}
			type="button"
		>
			Sign in with Google
		</Button>
	);
};

export default GoogleSignUp;
