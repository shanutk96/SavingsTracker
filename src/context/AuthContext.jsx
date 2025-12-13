import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Normalize user object
                setUser({
                    uid: currentUser.uid,
                    email: currentUser.email,
                    username: currentUser.displayName || currentUser.email.split('@')[0],
                    photoURL: currentUser.photoURL
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
        }
    };

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
            return { success: false, message: msg };
        }
    };

    const signup = async (username, email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with username
            await updateProfile(userCredential.user, {
                displayName: username
            });
            // Force update local state if needed immediately, though onAuthStateChanged triggers
            return { success: true };
        } catch (error) {
            let msg = error.message;
            if (error.code === 'auth/email-already-in-use') msg = 'Email already in use.';
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loginWithGoogle, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
