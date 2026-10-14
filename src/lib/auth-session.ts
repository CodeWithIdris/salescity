import type { User } from "@supabase/supabase-js";

let authUser: User | null = null;
const listeners = new Set<() => void>();

export function getAuthUser() {
  return authUser;
}

export function subscribeToAuthUser(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setAuthUser(user: User | null) {
  if (authUser?.id === user?.id && authUser?.email === user?.email) return;
  authUser = user;
  listeners.forEach((listener) => listener());
}