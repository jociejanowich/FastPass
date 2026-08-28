import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container #root not found');
}

// HashRouter keeps client-side routing working on static hosts (GitHub Pages)
// without a server-side SPA fallback. Routes look like /#/dashboard.
createRoot(container).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
