import { createContext, useContext, useEffect, useState } from "react";
import { account, sendPasswordRecovery } from '../lib/appwrite.js'; 
import { ID } from "appwrite";
import { saveUserProfile, getUserProfile } from '../lib/appwriteDB.js';

const AuthContext = createContext(undefined);

// Admin emails - add admin emails here
const ADMIN_EMAILS = ['nutrilizowgay@gmail.com'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const userData = await account.get();
      setUser(userData);
      // check if admin by email or labels
      setIsAdmin(ADMIN_EMAILS.includes(userData.email) || userData.labels?.includes('admin'));
      // Fetch user profile data
      await fetchUserProfile(userData.$id);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchUserProfile = async (userId)   => {
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
      // Set admin status on login
      const adminStatus = ADMIN_EMAILS.includes(session.email) || session.labels?.includes('admin');
      setIsAdmin(adminStatus);
      await fetchUserProfile(session.$id);
      // Return admin status so login page can redirect appropriately
      return { success: true, isAdmin: adminStatus };
    }
    catch (error) {
      if (error instanceof Error) {
        console.log("Error message: ", error.message);
        return { success: false, error: error.message };
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      const successUrl = import.meta.env.VITE_APPWRITE_OAUTH_REDIRECT_URL
        || `${window.location.origin}/`;
      const failureUrl = import.meta.env.VITE_APPWRITE_OAUTH_FAILURE_URL
        || `${window.location.origin}/login`;

      await account.createOAuth2Session('google', successUrl, failureUrl);
      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error message: ", error.message);
        return { success: false, error: error.message };
      }
      return { success: false, error: 'Google login failed' };
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
    <AuthContext.Provider value={{ 
      user,
      isAdmin, 
      isLoadingUser, 
      userProfile, 
      signUp, 
      signIn, 
      signInWithGoogle,
      signOut, 
      updateUserProfile, 
      forgotPassword
      }}>
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