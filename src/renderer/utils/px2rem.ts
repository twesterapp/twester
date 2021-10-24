export function px2rem(valInPx: number): string {
    const valInEm = valInPx / 16;
    return `${valInEm}rem`;
}
