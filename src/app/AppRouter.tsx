import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Layout } from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import EmpresasPage from '@/pages/empresas/EmpresasPage';
import EmpresaModulosPage from '@/pages/empresas/EmpresaModulosPage';
import ModulosPage from '@/pages/modulos/ModulosPage';

// Só guarda sessão quem é admin_plataforma (authService.login). O backend
// valida a mesma permissão em todas as rotas usadas pelo painel.
export const RequireAuth: React.FC = () =>
  authService.isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;

const PublicOnly: React.FC = () =>
  authService.isAuthenticated() ? <Navigate to="/empresas" replace /> : <Outlet />;

export const AppRouter: React.FC = () => (
  <Routes>
    <Route element={<PublicOnly />}>
      <Route path="/login" element={<LoginPage />} />
    </Route>
    <Route element={<RequireAuth />}>
      <Route element={<Layout />}>
        <Route path="/empresas" element={<EmpresasPage />} />
        <Route path="/empresas/:codempresa/modulos" element={<EmpresaModulosPage />} />
        <Route path="/modulos" element={<ModulosPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/empresas" replace />} />
  </Routes>
);
