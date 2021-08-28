import React from 'react';
import { ThemeProvider } from 'styled-components';
import {
  MemoryRouter as Router,
  Switch,
  Route,
  useHistory,
} from 'react-router-dom';
import 'typeface-poppins';
import 'typeface-karla';

import { darkTheme, GlobalStyle } from './ui/theme';
import { Button } from './ui/Button';
import { Auth } from './pages/Auth';
import { isAuth, px2em } from './utils';

function Welcome() {
  const history = useHistory();
  const username = window.localStorage.getItem('username');

  React.useEffect(() => {
    if (!isAuth) {
      history.push('/auth');
    }
  }, [history]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <h1 style={{ lineHeight: px2em(22) }}>Authenticated as {username}</h1>
      <Button
        text="Logout"
        onClick={() => {
          window.localStorage.removeItem('access-token');
          window.location.reload();
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <GlobalStyle />
      <Router>
        <Switch>
          <Route path="/" exact component={Welcome} />
          <Route path="/auth" component={Auth} />
        </Switch>
      </Router>
    </ThemeProvider>
  );
}
