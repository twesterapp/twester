import { delToken, delUser } from 'renderer/stores/useAuthStore';

export function signout() {
    delToken();
    delUser();
    window.location.reload();
}
