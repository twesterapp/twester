export function px2em(valInPx: number): string {
  const valInEm = valInPx / 16;
  return valInEm + "em";
}

export function isServer() {
  return typeof window === "undefined";
}
