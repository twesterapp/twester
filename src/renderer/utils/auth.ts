import { auth } from 'renderer/core/auth';

export function signout() {
    auth.delToken();
    auth.delUser();
    window.location.reload();
}
