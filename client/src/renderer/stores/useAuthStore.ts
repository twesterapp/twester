import create from 'zustand';
import { combine } from 'zustand/middleware';

export interface User {
  accessToken: string;
  displayName: string;
  id: string;
  login: string;
  profileImageUrl: string;
}

interface State {
  user: User;
}

const getStorageKey = () => 'user';

function getInitialState(): State {
  try {
    const user: User = JSON.parse(localStorage.getItem(getStorageKey()) || '');

    return { user };
  } catch {
    return {
      user: {
        accessToken: '',
        displayName: '',
        id: '',
        login: '',
        profileImageUrl: '',
      },
    };
  }
}

export const useAuthStore = create(
  combine(getInitialState(), (set) => ({
    setUser: (user: User) => {
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(user));
      } catch {}

      return set({ user });
    },

    delUser: () => {
      try {
        localStorage.removeItem(getStorageKey());
      } catch {}

      return set({
        user: {
          accessToken: '',
          displayName: '',
          id: '',
          login: '',
          profileImageUrl: '',
        },
      });
    },
  }))
);
