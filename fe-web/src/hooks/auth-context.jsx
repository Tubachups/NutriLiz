import { createContext, useContext, useEffect, useState } from "react";
import { account, sendPasswordRecovery } from '../lib/appwrite.js'; 
import { ID } from "appwrite";
import { saveUserProfile, getUserProfile } from '../lib/appwriteDB.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      // Fetch user profile data
      await fetchUserProfile(userData.$id);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile: ", error);
      setUserProfile(null);
    }
  }

  const updateUserProfile = async (profileData) => {
    if (!user) return;
    try {
      const updatedProfile = await saveUserProfile(user.$id, profileData);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile: ", error);
      throw error;
    }
  }

  const signUp = async (email, password, name) => {
    try {
      const randomID = ID.unique();

      // 3. Web SDK standard is positional arguments, not an object.
      // Ensure your logic matches the SDK version you are using.
      await account.create(
        randomID, // userId
        email, 
        password, 
        name
      );
      
      // Optional: Automatically sign in after sign up
      // await signIn(email, password);
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
      await account.createEmailPasswordSession(
        email,
        password
      );

      const session = await account.get();
      setUser(session);
      await fetchUserProfile(session.$id);
      return null;
    }
    catch (error) {
      if (error instanceof Error) {
        console.log("Error message: ", error.message);
        return error.message;
      }
    }
  };

  const signOut = async (onLogoutCallback) => {
  try {
    await account.deleteSession("current");
    setUser(null);
    setUserProfile(null);
    // Call callback if provided (for clearing scan data)
    if (onLogoutCallback) {
      onLogoutCallback();
    }
  } catch (error) {
    console.log("Error signing out: ", error);
  }
}

  const forgotPassword = async (email) => {
    try {
      // Redirect to the dedicated password reset domain
      await sendPasswordRecovery(email, 'https://nutri-liz.vercel.app'); 
      return { success: true };
    } catch (error) {
      console.error('Password recovery error:', error);
      return { success: false, error: error.message };
    }
  };

  

  return (
    <AuthContext.Provider value={{ user, isLoadingUser, userProfile, signUp, signIn, signOut, updateUserProfile, forgotPassword}}>
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