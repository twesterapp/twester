interface Color {
    background: string;
    background2: string;
    background3: string;
    brightBlue: string;
    borderOnDisabled: string;
    disabled: string;
    error: string;
    onDisabled: string;
    onPrimary: string;
    onPrimaryHover: string;
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
        disabled: '#00477A',
        error: '#FF5252',
        onDisabled: '#A0A0A0',
        onPrimary: '#FFFFFF',
        onPrimaryHover: '#1484CF',
        primary: '#3498DB',
        secondary: '#FFB703',
        success: '#0AD48B',
        textAlter: '#040F0F',
        textPrimary: '#F1F1F1',
        textFaded: '#979797',
    },
};
