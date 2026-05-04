import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSampleData } from './lib/sampleData';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize sample data on app startup
console.log('[v0] Initializing app...');

async function bootstrap() {
  try {
    console.log('[v0] Starting sample data initialization...');
    await initializeSampleData();
    console.log('[v0] Sample data initialized successfully');
  } catch (error) {
    console.error('[v0] Error initializing sample data:', error);
  }
  
  console.log('[v0] Rendering app...');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

bootstrap();
