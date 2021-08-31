export function getToken() {
  return window.localStorage.getItem('access-token');
}

export function getUsername() {
  return window.localStorage.getItem('username');
}

export function isAuth() {
  return !!window.localStorage.getItem('access-token');
}

export function fakeLogin() {
  window.localStorage.setItem('access-token', 'fakelogin');
  window.localStorage.setItem('username', 'fakelogin');
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
