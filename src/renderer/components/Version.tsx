import React from 'react';
import styled from 'styled-components';

import { useAppVersion } from 'renderer/hooks';

export function Version() {
    const version = useAppVersion();

    return <StyledVersion>v{version}</StyledVersion>;
}

const StyledVersion = styled.p`
    font-size: 14px;
    font-family: Roboto Mono;
    color: ${(props) => props.theme.color.borderOnDisabled};
    position: absolute;
    bottom: 4px;
    left: 12px;
`;
