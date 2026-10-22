import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { system } from '@/theme';
import { Toaster } from '@/components/toaster';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

export const Providers: React.FC<{ client: QueryClient; children: React.ReactNode }> = ({ client, children }) => (
  <ChakraProvider value={system}>
    <QueryClientProvider client={client}>
      {children}
      <Toaster />
    </QueryClientProvider>
  </ChakraProvider>
);
