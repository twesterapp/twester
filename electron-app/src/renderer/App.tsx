import React from 'react';
import { ThemeProvider } from 'styled-components';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import 'typeface-poppins';
import 'typeface-karla';

import { darkTheme, GlobalStyle } from './ui/theme';
import { Button } from './ui/Button';
import { InputText } from './ui/Input';

const HomePage = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1>Twester</h1>
      <InputText
        placeholder="Default"
        width="300px"
        style={{ marginBottom: '1em' }}
      />
      <Button text="Default" width="300px" />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      <Router>
        <Switch>
          <Route path="/" component={HomePage} />
        </Switch>
      </Router>
    </ThemeProvider>
  );
}
