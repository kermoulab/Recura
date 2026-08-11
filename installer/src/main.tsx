import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { InstallApp } from './InstallApp';
import '../../src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <InstallApp />
  </StrictMode>,
);
