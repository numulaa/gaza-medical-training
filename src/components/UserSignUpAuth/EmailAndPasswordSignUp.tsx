import React, { useState } from "react";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "../ui/button";

const EmailAndPasswordSignUp: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Signed up:", userCredential.user);
      setSuccess("Account created successfully!");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Sign-up error:", error);
      setError(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Sign up with Email & Password</h1>
      <form onSubmit={handleSignUp} className="flex flex-col space-y-4 max-w-sm">
        <input
          type="email"
          placeholder="Email"
          className="border rounded-md px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border rounded-md px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit">Sign Up</Button>
      </form>

      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
    </div>
  );
};

export default EmailAndPasswordSignUp;
