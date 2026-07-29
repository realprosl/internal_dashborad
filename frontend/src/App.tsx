import { Router, Route } from '@solidjs/router';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import ObrasPage from './pages/ObrasPage';
import OperariosPage from './pages/OperariosPage';
import PlaningPage from './pages/PlaningPage';
import DashboardPage from './pages/DashboardPage';
import MaterialesPage from './pages/MaterialesPage';
import LoginPage from './pages/LoginPage';
import AppInitializer from './components/AppInitializer';

// AppInitializer usa useNavigate/useLocation → debe renderizarse DENTRO
// de un Route. Como /login y el resto de rutas usan componentes raíz
// distintos, lo envolvemos en cada uno.
const LoginWrapper = () => (
  <>
    <AppInitializer />
    <LoginPage />
  </>
);

const LayoutWithInit = (props: { children?: any }) => (
  <>
    <AppInitializer />
    <Layout>{props.children}</Layout>
  </>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        {/* /login standalone — sin Layout pero con guard */}
        <Route path="/login" component={LoginWrapper} />
        {/* Resto envuelto en Layout (que también incluye el guard) */}
        <Route path="/" component={LayoutWithInit}>
          <Route path="/obras" component={ObrasPage} />
          <Route path="/operarios" component={OperariosPage} />
          <Route path="/planing" component={PlaningPage} />
          <Route path="/materiales" component={MaterialesPage} />
          <Route path="/" component={DashboardPage} />
        </Route>
      </Router>
    </ThemeProvider>
  );
}

export default App;