import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from '@/app/AppRouter';
import { createQueryClient, Providers } from '@/app/Providers';

const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers client={queryClient}>
        <AppRouter />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>
);
