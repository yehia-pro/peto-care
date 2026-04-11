import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './i18n/en.json';
const root = createRoot(document.getElementById('root')!);
root.render(<App />);
