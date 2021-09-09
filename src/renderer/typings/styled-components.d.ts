import { darkTheme } from '../ui';

type ThemeInterface = typeof darkTheme;

declare module 'styled-components' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface DefaultTheme extends ThemeInterface {}
}
