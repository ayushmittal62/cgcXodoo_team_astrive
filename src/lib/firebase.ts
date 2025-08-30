import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Logged in:", user);
    } else {
      console.log("Logged out");
    }
  });
  return () => unsubscribe();
}, []);