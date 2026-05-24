import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorker from "./serviceWorker"
import { initPresets } from './utils/icon-presets';

const container = document.getElementById('root');
const root = createRoot(container!);

initPresets().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

serviceWorker.register(null);