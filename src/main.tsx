import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeSampleData } from './lib/sampleData';

// Initialize sample data on app startup
console.log('[v0] Initializing app...');

async function bootstrap() {
  try {
    await initializeSampleData();
    console.log('[v0] Sample data initialized');
  } catch (error) {
    console.error('[v0] Error initializing sample data:', error);
  }
  
  console.log('[v0] Rendering app...');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
