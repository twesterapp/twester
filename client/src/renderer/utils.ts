export const isAuth = !!window.localStorage.getItem('access-token');

export function px2em(valInPx: number): string {
  const valInEm = valInPx / 16;
  return `${valInEm}em`;
}
