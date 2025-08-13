import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../config/Config";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced register function
  const register = async (fullName, phone, email, password, role = "Admin") => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: fullName,
      });

      // Save additional user data to Firestore
      await saveUserToFirestore({
        uid: user.uid,
        fullName,
        phone,
        email,
        role,
        createdAt: new Date(),
      });

      // Refresh user data
      const token = await getIdToken(user, true);
      setCurrentUser({ ...user });
      setUserToken(token);

      return user;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // New deleteUser function
  const deleteUser = async (userId) => {
    try {
      // Delete from Firestore
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };
  // Save user to Firestore
  const saveUserToFirestore = async (userData) => {
    try {
      const userRef = doc(db, "users", userData.uid);
      await setDoc(userRef, userData);
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
      throw error;
    }
  };

  // Get all users from Firestore
  const getAllUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return usersList;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  // Update user role
  const updateUserRole = async (uid, newRole) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        role: newRole,
      });
      return true;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await getIdToken(user);
      setCurrentUser(user);
      setUserToken(token);
      return { user, token };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserToken(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Watch auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const token = await getIdToken(user);
          setCurrentUser(user);
          setUserToken(token);
        } else {
          setCurrentUser(null);
          setUserToken(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const providerValue = {
    currentUser,
    userToken,
    register,
    login,
    logout,
    saveUserToFirestore,
    getAllUsers,
    updateUserRole,
    deleteUser,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: providerValue },
    !loading && children
  );
};
