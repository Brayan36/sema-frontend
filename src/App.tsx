import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import MiFinca from './features/territorios/MiFinca';
import MapaSatelital from './features/territorios/MapaSatelital';
import type { BorradorFinca } from './types/finca';

export default function App() {
  const [borrador, setBorrador] = useState<BorradorFinca | null>(null);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/mi-finca" replace />} />
        <Route path="mi-finca" element={<MiFinca borrador={borrador} onSeleccionar={setBorrador} />} />
        <Route path="mapa" element={<MapaSatelital borrador={borrador} onActualizar={setBorrador} />} />
        <Route path="*" element={<Navigate to="/mi-finca" replace />} />
      </Route>
    </Routes>
  );
}
