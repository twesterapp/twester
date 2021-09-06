import React from 'react';
import { Streamer, removeStreamer } from 'renderer/stores/useStreamerStore';
import { Avatar, IconCross } from 'renderer/ui';
import { px2rem } from 'renderer/utils';
import styled, { useTheme } from 'styled-components';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import humanFormat from 'human-format';

interface StreamerCardProps {
  streamer: Streamer;
}

export function StreamerCard({ streamer }: StreamerCardProps) {
  // TODO: For grabbing state UI/Cursor we would probably use some state
  // provided by `react-dnd` (drag-n-drop).
  const theme = useTheme();

  return (
    <Card>
      <Content>
        <button
          id="remove-button"
          onClick={() => removeStreamer(streamer.id)}
          type="button"
        >
          <IconCross size={12} color={theme.color.onPrimary} />
        </button>

        <Avatar
          src={streamer.profileImageUrl}
          size={64}
          alt={`${streamer.displayName} profile`}
          border={false}
          style={{ margin: '14px' }}
        />

        <div>
          <h1>{streamer.displayName}</h1>
          <p>
            {humanFormat(streamer.followersCount, {
              decimals: 1,
              separator: '',
            }).toUpperCase()}{' '}
            followers
          </p>
        </div>
      </Content>

      <p id="streamer-priority-rank">#{streamer.priorityRank}</p>
    </Card>
  );
}

const Card = styled.div`
  width: 405px;
  height: 92px;
  background: ${(props) => props.theme.color.background2};
  color: ${(props) => props.theme.color.textPrimary};
  border-radius: 14px;
  position: relative;
  margin-bottom: ${px2rem(16)};

  transition: background-color 200ms ease-out;

  &:hover {
    background: ${(props) => props.theme.color.background3};

    #remove-button {
      display: flex;
    }
  }

  #remove-button {
    position: absolute;
    border: none;
    top: 10px;
    right: 10px;
    height: 28px;
    width: 28px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    display: none;
    cursor: pointer;
    background: ${(props) => props.theme.color.background2};

    transition: background-color 100ms ease-out;

    &:hover {
      background: ${(props) => props.theme.color.error};
    }
  }

  #streamer-priority-rank {
    user-select: none;
    position: absolute;
    margin: 0;
    bottom: 10px;
    right: 10px;
  }
`;

const Content = styled.div`
  width: 90%;
  height: 100%;
  display: flex;
  align-items: center;

  h1 {
    font-size: ${px2rem(24)};
    margin: 0;
    color: ${(props) => props.theme.color.textPrimary};
  }

  p {
    user-select: none;
    font-size: ${px2rem(16)};
    margin: 0;
    margin-top: ${px2rem(4)};
    color: ${(props) => props.theme.color.textPrimary};
  }
`;
