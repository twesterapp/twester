interface Color {
    background: string;
    background2: string;
    background3: string;
    background4: string;
    disabled: string;
    error: string;
    onPrimary: string;
    primary: string;
    success: string;
    textPrimary: string;
}

export interface Theme {
    name: 'dark' | 'light';
    color: Color;
}

export const darkTheme: Theme = {
    name: 'dark',
    color: {
        background: '#18171F',
        background2: '#242329',
        background3: '#2A2931',
        background4: '#34333A',
        disabled: '#464649',
        error: '#FF5252',
        onPrimary: '#FFFFFF',
        primary: '#3498DB',
        success: '#0AD48B',
        textPrimary: '#F1F1F1',
    },
};
