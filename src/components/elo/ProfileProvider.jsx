import { createContext, useContext, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/server-fns";

const ProfileContext = createContext({ profile: null, loading: true, refresh: async () => null });

export function ProfileProvider({ children }) {
  const fetchProfile = useServerFn(getMyProfile);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const found = await fetchProfile();
    setProfile(found ?? null);
    return found;
  };

  useEffect(() => {
    let alive = true;
    fetchProfile()
      .then((found) => alive && setProfile(found ?? null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh }}>{children}</ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);