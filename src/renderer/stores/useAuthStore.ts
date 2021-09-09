import create from 'zustand';
import vanillaCreate from 'zustand/vanilla';

export interface User {
  displayName: string;
  id: string;
  login: string;
  profileImageUrl: string;
}

interface State {
  user: User;
  accessToken: string;
}

function getInitialState(): State {
  try {
    const user: User = JSON.parse(localStorage.getItem('user') || '');
    const token = localStorage.getItem('access-token') || '';

    return { user, accessToken: token };
  } catch {
    return {
      user: {
        displayName: '',
        id: '',
        login: '',
        profileImageUrl: '',
      },
      accessToken: '',
    };
  }
}

export const authStore = vanillaCreate(() => getInitialState());
export const useAuthStore = create(authStore);

export function setUser(user: User) {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch {}

  return authStore.setState({ user });
}

export function delUser() {
  try {
    localStorage.removeItem('user');
  } catch {}

  return authStore.setState({
    user: {
      displayName: '',
      id: '',
      login: '',
      profileImageUrl: '',
    },
  });
}

export function setToken(accessToken: string) {
  try {
    localStorage.setItem('access-token', accessToken);
  } catch {}

  return authStore.setState({ accessToken });
}

export function delToken() {
  try {
    localStorage.removeItem('access-token');
  } catch {}

  return authStore.setState({
    accessToken: '',
  });
}
