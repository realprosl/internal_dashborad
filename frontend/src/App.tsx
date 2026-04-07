import { Router, Route } from '@solidjs/router';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ObrasPage from './pages/ObrasPage';
import OperariosPage from './pages/OperariosPage';
import PlaningPage from './pages/PlaningPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Route path="/" component={Layout}>
          <Route path="/obras" component={ObrasPage} />
          <Route path="/operarios" component={OperariosPage} />
          <Route path="/planing" component={PlaningPage} />
          <Route path="/" component={DashboardPage} />
        </Route>
      </Router>
    </ThemeProvider>
  );
}

export default App;
