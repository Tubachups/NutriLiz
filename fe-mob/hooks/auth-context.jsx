import { createContext, useContext, useEffect, useState } from "react";
import { account } from '../lib/appwrite.js';
import { ID } from "react-native-appwrite";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const randomID = ID.unique();

      // Create the account first
      await account.create({
        userId: randomID, // Pass as separate arguments, not an object
        email,
        password,
        name  
      });
    }
    catch (error) {
      if (error instanceof Error) {
        console.log("Error message: ", error.message);
        return error.message;
      }
    }
  };

  const signIn = async (email, password) => {
    try {
      await account.createEmailPasswordSession({
        email,
        password
      })
      const session = await account.get();
      setUser(session);
      return null;
    }
    catch (error) {
      if (error instanceof Error) {
        console.log("Error message: ", error.message);
        return error.message;
      }
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession({ sessionId: "current"});
      setUser(null);
    } catch (error) {
      console.log("Error signing out: ", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoadingUser, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}