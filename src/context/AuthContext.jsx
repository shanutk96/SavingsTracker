import { createContext, useContext, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useLocalStorage('registered_users', []); // Store array of { username, password }

    const login = (username, password) => {
        const foundUser = users.find(u => u.username === username && u.password === password);
        if (foundUser) {
            setUser({ username: foundUser.username });
            return true;
        }
        return false;
    };

    const signup = (username, password) => {
        if (users.some(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }
        setUsers([...users, { username, password }]);
        setUser({ username }); // Auto login after signup
        return { success: true };
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
