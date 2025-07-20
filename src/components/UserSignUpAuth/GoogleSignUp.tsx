import React, { useState } from "react";
import { auth, googleProvider } from "../../lib/firebase";
import { signInWithPopup, User } from "firebase/auth";
import { Button } from "../ui/button";


function GoogleSignUp() {
  const [user, setUser] = useState<User | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
    }
  };

  return (
    <div className="GoogleSignUp">
    
      {!user ? (
        <Button onClick={handleGoogleSignIn}>Sign in with Google</Button>
      ) : (
        <div>
          <h2>Welcome, {user.displayName}</h2>
          <img src={user.photoURL || ""} alt="User Avatar" />
        </div>
      )}
    </div>
  );
}

export default GoogleSignUp;
