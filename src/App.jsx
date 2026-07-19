import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import ComingSoon from './components/layout/ComingSoon';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Obras from './pages/obras/Obras';
import ObraDetail from './pages/obras/ObraDetail';
import Gastos from './pages/gastos/Gastos';
import Tareas from './pages/tareas/Tareas';
import Novedades from './pages/novedades/Novedades';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/obras" element={<Obras />} />
              <Route path="/obras/:id" element={<ObraDetail />} />
              <Route path="/obras/:id/gastos" element={<Gastos />} />
              <Route path="/obras/:id/tareas" element={<Tareas />} />
              <Route path="/obras/:id/novedades" element={<Novedades />} />
              <Route path="/obras/:id/progreso" element={<ComingSoon label="Avance fotográfico" />} />
              <Route path="/obras/:id/bitacora" element={<ComingSoon label="Bitácora" />} />
            </Route>

            <Route path="*" element={<Navigate to="/obras" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
