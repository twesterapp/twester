import React from 'react';
import { Button } from 'renderer/ui';
import { claimChannelPointsBonus } from 'renderer/twitch/graphql';

export function HomePage() {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Home</h1>
      <Button text="Start watching" />
      <Button
        text="Claim bonus"
        onClick={() =>
          claimChannelPointsBonus(
            'asunaweeb',
            '8c84d1c9-bbf1-4893-9270-ec11b8505e74'
          )
        }
      />
    </div>
  );
}
