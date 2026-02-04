import { createContext, useContext, useEffect, useState } from "react";
import { account ,sendPasswordRecovery } from '../lib/appwrite.js';
import { ID } from "react-native-appwrite";
import {Alert } from 'react-native';
import { saveUserProfile, getUserProfile } from '../lib/appwriteDb.js';

const AuthContext = createContext(undefined);
const ADMIN_EMAILS = ['nutrilizowgay@gmail.com']

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
      setIsAdmin(ADMIN_EMAILS.includes(userData.email) || userData.labels?.includes('admin'));
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

    // Create the account first
    await account.create({
      userId: randomID,
      email,
      password,
      name  
    });
  }
  catch (error) {
    if (error instanceof Error) {
      console.log("Error message: ", error.message);
      // Clean up the error message by removing technical prefix
      let cleanError = error.message;
      if (cleanError.includes('Invalid `password` param:')) {
        cleanError = cleanError.replace('Invalid `password` param:', '').trim();
      }
      return cleanError;
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
      const adminStatus = ADMIN_EMAILS.includes(session.email) || session.labels?.includes('admin');
      setIsAdmin(adminStatus);
      // Fetch user profile data
      await fetchUserProfile(session.$id);
      return { success: true, isAdmin: adminStatus };
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
      setUserProfile(null);
    } catch (error) {
      console.log("Error signing out: ", error);
    }
  }

  const forgotPassword = async (email) => {
    try {
      await sendPasswordRecovery(email);
      return { success: true };
    } catch (error) {
      Alert.alert("Error", 'You’ve requested too many password recovery emails in a short period. For security, this action is limited per hour. Please wait a few hours before trying again.');
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoadingUser, userProfile, signUp, signIn, signOut, updateUserProfile, forgotPassword}}>
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