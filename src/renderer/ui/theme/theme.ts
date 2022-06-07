interface Color {
    background: string;
    background2: string;
    background3: string;
    brightBlue: string;
    borderOnDisabled: string;
    disabledError: string;
    disabledPrimary: string;
    disabledSecondary: string;
    error: string;
    onDisabled: string;
    onErrorHover: string;
    onPrimary: string;
    onPrimaryHover: string;
    onSecondaryHover: string;
    primary: string;
    secondary: string;
    success: string;
    textAlter: string;
    textFaded: string;
    textPrimary: string;
}

export interface Theme {
    name: 'dark';
    color: Color;
}

export const darkTheme: Theme = {
    name: 'dark',
    color: {
        background: '#00171F',
        background2: '#003459',
        background3: '#003F6B',
        brightBlue: '#8ECAE6',
        borderOnDisabled: '#0066AE',
        disabledError: '#7A2727',
        disabledPrimary: '#00477A',
        disabledSecondary: '#7A5801',
        error: '#FF5252',
        onDisabled: '#A0A0A0',
        onErrorHover: '#CC4141',
        onPrimary: '#FFFFFF',
        onPrimaryHover: '#1484CF',
        onSecondaryHover: '#D99C02',
        primary: '#3498DB',
        secondary: '#FFB703',
        success: '#0AD48B',
        textAlter: '#040F0F',
        textPrimary: '#F1F1F1',
        textFaded: '#9196A8',
    },
};
