// context/AuthContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { loginRequest, registerRequest } from "@/services/api";

type User = {
  userId?: number;
  username?: string;
  email?: string;
  role?: string;
  timezone?: string;
};

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  role: string;
  timezone: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "mavie_auth_token";
const USER_KEY = "mavie_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await loginRequest(email.trim(), password);

    if (!data.token) {
      throw new Error("Login succeeded, but no token was returned.");
    }

    setToken(data.token);
    setUser(data.user);

    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  async function register(payload: RegisterPayload) {
    await registerRequest({
      username: payload.username.trim(),
      email: payload.email.trim(),
      password: payload.password,
      role: payload.role || "patient",
      timezone: payload.timezone || "Asia/Seoul",
    });
  }

  async function logout() {
    setToken(null);
    setUser(null);

    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}