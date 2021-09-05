export function getToken() {
  return window.localStorage.getItem('access-token');
}

export function getUsername() {
  return window.localStorage.getItem('username');
}

export function getUserId(): string {
  return window.localStorage.getItem('user-id') || '';
}

export function setUserId(id: string) {
  return window.localStorage.setItem('user-id', id);
}

export function isAuth() {
  return !!window.localStorage.getItem('access-token');
}

export function logout() {
  window.localStorage.removeItem('access-token');
  window.localStorage.removeItem('username');
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
