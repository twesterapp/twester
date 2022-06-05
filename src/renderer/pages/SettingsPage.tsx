import React from 'react';
import styled from 'styled-components';

import { px2rem } from 'renderer/utils/px2rem';
import { Version } from 'renderer/components/Version';
import { Switch } from 'renderer/ui/Switch';
import { Button, IconTrash } from 'renderer/ui';
import { settings } from 'renderer/core/settings';

export function SettingsPage() {
    const { closeToTray, developerMode } = settings.useStore();

    return (
        <PageWrapper>
            <Title>Settings</Title>

            <SettingsList>
                <SettingRow>
                    <div>
                        <SettingTitle>Close to tray</SettingTitle>
                        <SettingDescription>
                            Twester will minimize to tray instead of quitting.
                        </SettingDescription>
                    </div>
                    <Switch
                        checked={closeToTray}
                        onChange={() => settings.toggleCloseToTry()}
                    />
                </SettingRow>

                <SettingRow>
                    <div>
                        <SettingTitle>Developer Mode</SettingTitle>
                        <SettingDescription>
                            Enables logging in console. Helpful for debugging
                            while reporting issues.
                        </SettingDescription>
                    </div>
                    <Switch
                        checked={developerMode}
                        onChange={() => settings.toggleDeveloperMode()}
                    />
                </SettingRow>

                <SettingRow style={{ border: 'none' }}>
                    <div>
                        <SettingTitle>Delete my data</SettingTitle>
                        <SettingDescription>
                            Deletes the list of added streamers, their stats and
                            the watcher data.
                        </SettingDescription>
                    </div>
                    <Button secondary style={{ marginRight: px2rem(8) }}>
                        <IconTrash />
                    </Button>
                </SettingRow>
            </SettingsList>

            <Version />
        </PageWrapper>
    );
}

const PageWrapper = styled.div`
    padding: ${`${px2rem(16)} ${px2rem(24)}`};
`;

const Title = styled.h1`
    margin-bottom: ${px2rem(36)};
`;

const SettingsList = styled.ul`
    display: flex;
    flex-direction: column;
    row-gap: 24px;
    padding: 0;
`;

const SettingRow = styled.li`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: ${px2rem(24)};
    border-bottom: 1px solid ${(props) => props.theme.color.background2};
`;

const SettingTitle = styled.h3`
    font-size: 18px;
    margin-top: 0px;
    margin-bottom: 10px;
`;

const SettingDescription = styled.p`
    font-size: 14px;
    color: ${(props) => props.theme.color.textFaded};
`;
