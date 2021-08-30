interface Color {
  background: string;
  background2: string;
  background3: string;
  background4: string;
  primary: string;
  onPrimary: string;
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
    primary: '#3498DB',
    onPrimary: '#FFFFFF',
    textPrimary: '#F1F1F1',
  },
};
