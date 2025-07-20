import React, { useState, useRef } from "react";
import { auth } from "../../lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, PhoneAuthProvider } from "firebase/auth";
import { Button } from "../ui/button";

const PhoneNumberSignUp: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "invisible",
                    callback: (response: any) => {
                        handleSendCode(response);
  },
                },
                

            );
        }
    };

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setupRecaptcha();

        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
        } catch (error: any) {
            console.error(error);
            setError(error.message);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!confirmationResult) return;

        try {
            const userCredential = await confirmationResult.confirm(verificationCode);
            console.log("Phone user signed in:", userCredential.user);
        } catch (error: any) {
            console.error(error);
            setError(error.message);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold">Phone Number Sign Up</h1>

            {!confirmationResult ? (
                <form onSubmit={handleSendCode} className="space-y-4 max-w-sm">
                    <input
                        type="tel"
                        placeholder="+1 555-555-5555"
                        className="border rounded-md px-3 py-2 w-full"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                    />
                    <Button type="submit">Send Verification Code</Button>
                    <div id="recaptcha-container" />
                </form>
            ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4 max-w-sm">
                    <input
                        type="text"
                        placeholder="Verification Code"
                        className="border rounded-md px-3 py-2 w-full"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                    />
                    <Button type="submit">Verify Code</Button>
                </form>
            )}

            {error && <p className="text-red-500">{error}</p>}
            
        </div>

    );

};

export default PhoneNumberSignUp;
