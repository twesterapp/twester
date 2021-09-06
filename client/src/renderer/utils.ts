import { User } from './stores/useAuthStore';

export function fakeLogin() {
  const user: User = {
    id: '670111413',
    accessToken: 'zoc3pj71n6rt08u83bd8ev2xm62c6k',
    displayName: 'ceoshikhar',
    login: 'ceoshikhar',
    profileImageUrl:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/40f633ca-8793-4eb7-bcd9-a225d5879537-profile_image-300x300.pn0',
  };

  localStorage.setItem('user', JSON.stringify(user));
  setToken('zoc3pj71n6rt08u83bd8ev2xm62c6k');
}

export function getUser(): User {
  try {
    const user: User = JSON.parse(localStorage.getItem('user') || '');
    return user;
  } catch {
    return {
      id: '',
      accessToken: '',
      displayName: '',
      login: '',
      profileImageUrl: '',
    };
  }
}

export function setToken(token: string) {
  localStorage.setItem('access-token', token);
}

export function getToken(): string {
  return localStorage.getItem('access-token') || '';
}

export function removeToken() {
  localStorage.removeItem('access-token');
}

export function px2em(valInPx: number): string {
  const valInEm = valInPx / 16;
  return `${valInEm}em`;
}

export function px2rem(valInPx: number): string {
  const valInEm = valInPx / 16;
  return `${valInEm}rem`;
}

export async function sleep(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}
