import React from 'react';
import { Button } from 'renderer/ui';
import {
  claimChannelPointsBonus,
  startWatching,
} from 'renderer/twitch/graphql';

export function HomePage() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Home</h1>
      <Button text="Start watching" onClick={async () => startWatching()} />
      <Button
        text="Claim bonus"
        onClick={() =>
          claimChannelPointsBonus(
            'asunaweeb',
            '57c26aee-5c5d-4f0a-979c-b6780b8ab1e5'
          )
        }
      />
    </div>
  );
}
