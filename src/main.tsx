import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import {detectDatabaseMode, getInstallRedirectTarget} from './db';
import './index.css';

async function bootstrap() {
  // Decide the data provider (server vs Supabase) before the first render so
  // App.tsx always sees a finalized facade.
  try {
    await detectDatabaseMode();
  } catch {
    /* detection never throws; guard keeps first paint safe */
  }

  const installTarget = getInstallRedirectTarget();
  if (installTarget) {
    // Not installed (or install in progress / failed) — route to the wizard.
    window.location.replace(installTarget);
    return;
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

bootstrap();
