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

function isPatient(user: User | null | undefined) {
  return String(user?.role || "").toLowerCase() === "patient";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function clearStoredAuth() {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
      const tokenValue = storedToken[1];
      const userValue = storedUser[1];

      if (!tokenValue || !userValue) return;

      const parsedUser = JSON.parse(userValue) as User;
      if (!isPatient(parsedUser)) {
        await clearStoredAuth();
        return;
      }

      setToken(tokenValue);
      setUser(parsedUser);
    } catch {
      await clearStoredAuth();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await loginRequest(email.trim(), password);

    if (!data.token || !data.user) {
      throw new Error("Login succeeded, but account information was not returned.");
    }

    if (!isPatient(data.user)) {
      throw new Error("This account is not a patient account. Please use the MaVie nurse app.");
    }

    setToken(data.token);
    setUser(data.user);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [USER_KEY, JSON.stringify(data.user)],
    ]);
  }

  async function register(payload: RegisterPayload) {
    await registerRequest({
      username: payload.username.trim(),
      email: payload.email.trim(),
      password: payload.password,
      role: "patient",
      timezone: payload.timezone || "Asia/Seoul",
    });
  }

  async function logout() {
    await clearStoredAuth();
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
