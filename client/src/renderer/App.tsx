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
import { LoadingScreen } from './components';

function Welcome() {
  const history = useHistory();
  const username = window.localStorage.getItem('username');
  const [btnLoading, setBtnLoading] = React.useState(false);
  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isAuth()) {
        history.push('/auth');
      }

      setShowLoading(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [history]);

  if (showLoading) return <LoadingScreen />;

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
        width="300px"
        onClick={() => {
          window.localStorage.removeItem('access-token');
          window.localStorage.removeItem('username');
          window.location.reload();
        }}
      />
      <br />
      <Button
        text="Click me"
        width="300px"
        loading={btnLoading}
        onClick={() => {
          setBtnLoading(true);
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
