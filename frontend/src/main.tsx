import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Add Tailwind base styles
import 'tailwindcss/tailwind.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);