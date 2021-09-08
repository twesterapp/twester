import { User, setUser, setToken } from './stores/useAuthStore';

export const isProd = process.env.NODE_ENV === 'PRODUCTION';

export function fakeLogin() {
  const user: User = {
    id: '670111413',
    displayName: 'ceoshikhar',
    login: 'ceoshikhar',
    profileImageUrl:
      'https://static-cdn.jtvnw.net/jtv_user_pictures/40f633ca-8793-4eb7-bcd9-a225d5879537-profile_image-300x300.pn0',
  };

  setUser(user);
  setToken('ep0202p2qbm0pqx34edauumbuwerl2');
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

export function rightNowInSecs(): number {
  return Math.floor(Date.now() / 1000);
}

export function noop() {}
