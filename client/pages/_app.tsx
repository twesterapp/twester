import { ThemeProvider } from "styled-components";
import type { AppProps } from "next/app";
import { darkTheme, GlobalStyle } from "../ui/theme";
import "../ui/theme/global.module.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <GlobalStyle />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  );
}
export default MyApp;
