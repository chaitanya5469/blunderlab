import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import './styles/index.css';
import { App } from './App';
import { setupNativeShell } from './native';
import { initBoardStyle } from './lib/boardThemes';
import { setupSound } from './lib/sound';

setupNativeShell();
initBoardStyle();
setupSound();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
