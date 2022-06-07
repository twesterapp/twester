import React from 'react';

import {
    Switch as MUISwitch,
    withStyles,
    SwitchProps,
} from '@material-ui/core';
import { useTheme } from 'styled-components';

export function Switch(props: SwitchProps) {
    const theme = useTheme();

    const StyledSwitch = withStyles({
        root: {
            padding: '9px',
        },
        switchBase: {
            color: theme.color.background3,
            '&$checked': {
                color: theme.color.brightBlue,
            },
            '&$checked + $track': {
                backgroundColor: theme.color.brightBlue,
            },
        },
        checked: {},
        track: {
            borderRadius: '8px',
            backgroundColor: theme.color.borderOnDisabled,
        },
    })(MUISwitch);

    return <StyledSwitch {...props} />;
}
