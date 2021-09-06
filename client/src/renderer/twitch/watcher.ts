import { authStore } from 'renderer/stores/useAuthStore';
import { loadChannelPointsContext } from './claimBonus';
import { doForEachStreamer, setStreamersToWatch } from './data';

export class Watcher {
  public static run() {
    if (!authStore.getState().accessToken || !authStore.getState().user.id) {
      console.error('User not authorized');
    }

    setStreamersToWatch();
    doForEachStreamer(loadChannelPointsContext);
  }
}
