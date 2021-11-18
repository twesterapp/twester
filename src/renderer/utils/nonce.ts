export function createNonce(length: number) {
    let nonce = '';
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i += 1) {
        nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return nonce;
}
