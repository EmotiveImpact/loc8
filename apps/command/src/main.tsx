import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './ui/theme.css';
import '../../../prototypes/command-digital-twin/src/styles.css';

const el = document.getElementById('root');
if (!el) throw new Error('root element missing');
createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
