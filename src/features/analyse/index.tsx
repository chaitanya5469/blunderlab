import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AnalyseHomePage } from './AnalyseHomePage';
import { AnalysisBoardPage } from './board/AnalysisBoardPage';
import { EditorPage } from './editor/EditorPage';

// Recognition (image processing + model runtime) loads only when the scanner is opened.
const ScanPage = lazy(() => import('./scan/ScanPage').then((m) => ({ default: m.ScanPage })));

/** Position scanner / editor / analysis board, under /analyse. */
export function AnalyseFeature() {
  return (
    <Routes>
      <Route index element={<AnalyseHomePage />} />
      <Route path="edit" element={<EditorPage />} />
      <Route path="board" element={<AnalysisBoardPage />} />
      <Route path="scan" element={<ScanPage />} />
      <Route path="*" element={<Navigate to="/analyse" replace />} />
    </Routes>
  );
}
