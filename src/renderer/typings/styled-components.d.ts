import { darkTheme } from '../ui';

type ThemeInterface = typeof darkTheme;

declare module 'styled-components' {
    interface DefaultTheme extends ThemeInterface {}
}
