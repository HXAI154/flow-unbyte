import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSampleData } from './lib/sampleData';

// Initialize sample data on app startup (only if not already initialized)
console.log('[v0] Initializing app...');
initializeSampleData();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
