import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Api from '../services/ApiService';
import * as Storage from '../services/storage';
import { isAuthError } from '../services/errors';

const AuthContext = createContext(null);

// Menyimpan sesi login (token JWT 1 jam + data user) dan status onboarding.
// Token disimpan di expo-secure-store agar pengguna tetap masuk setelah aplikasi ditutup.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [onboarded, setOnboarded] = useState(false);
  const [ready, setReady] = useState(false);

  const saveSession = async (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    await Storage.setItem(Storage.KEYS.token, nextToken);
    await Storage.setItem(Storage.KEYS.user, JSON.stringify(nextUser));
  };

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await Storage.removeItem(Storage.KEYS.token);
    await Storage.removeItem(Storage.KEYS.user);
  }, []);

  // Pulihkan sesi saat aplikasi dibuka
  useEffect(() => {
    (async () => {
      const [savedToken, savedUser, savedOnboarded] = await Promise.all([
        Storage.getItem(Storage.KEYS.token),
        Storage.getItem(Storage.KEYS.user),
        Storage.getItem(Storage.KEYS.onboarded),
      ]);
      setOnboarded(savedOnboarded === '1');
      if (savedToken) {
        setToken(savedToken);
        try {
          setUser(savedUser ? JSON.parse(savedUser) : null);
        } catch (e) {
          setUser(null);
        }
        // Cek token masih berlaku (JWT berumur 1 jam)
        Api.getMe(savedToken)
          .then((me) => {
            setUser(me);
            Storage.setItem(Storage.KEYS.user, JSON.stringify(me));
          })
          .catch((e) => {
            if (isAuthError(e)) logout();
          });
      }
      setReady(true);
    })();
  }, [logout]);

  const login = async (email, password) => {
    const data = await Api.login(email, password);
    const me = data.user || (await Api.getMe(data.token));
    await saveSession(data.token, me);
    return me;
  };

  const register = async (name, email, password) => {
    await Api.register(name, email, password);
    return login(email, password); // langsung masuk setelah daftar
  };

  const completeOnboarding = async () => {
    setOnboarded(true);
    await Storage.setItem(Storage.KEYS.onboarded, '1');
  };

  // Bungkus panggilan API yang butuh token. Jika token kedaluwarsa (401) → keluar otomatis.
  //   withAuth(Api.getItineraries)            → Api.getItineraries(token)
  //   withAuth(Api.getItinerary, itineraryId) → Api.getItinerary(token, itineraryId)
  const withAuth = useCallback(
    async (fn, ...args) => {
      try {
        return await fn(token, ...args);
      } catch (e) {
        if (isAuthError(e)) await logout();
        throw e;
      }
    },
    [token, logout],
  );

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      onboarded,
      isLoggedIn: Boolean(token),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      withAuth,
      completeOnboarding,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, ready, onboarded, logout, withAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
