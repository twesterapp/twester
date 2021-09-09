export class StreamerIsOfflineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'STREAMER_IS_OFFLINE_ERROR';
  }
}
