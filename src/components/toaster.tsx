import React from 'react';
import { createToaster, Portal, Spinner, Stack, Toast, Toaster as ChakraToaster } from '@chakra-ui/react';

export const toaster = createToaster({ placement: 'top-end', pauseOnPageIdle: true });

export const notify = {
  success: (title: string, description?: string) => toaster.create({ type: 'success', title, description }),
  error: (title: string, description?: string) => toaster.create({ type: 'error', title, description, duration: 8000 }),
  info: (title: string, description?: string) => toaster.create({ type: 'info', title, description, duration: 8000 }),
};

export const Toaster: React.FC = () => (
  <Portal>
    <ChakraToaster toaster={toaster} insetInline={{ mdDown: '4' }}>
      {(toast) => (
        <Toast.Root width={{ md: 'sm' }}>
          {toast.type === 'loading' ? <Spinner size="sm" color="brand.solid" /> : <Toast.Indicator />}
          <Stack gap="1" flex="1" maxWidth="100%">
            {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
            {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
          </Stack>
          <Toast.CloseTrigger />
        </Toast.Root>
      )}
    </ChakraToaster>
  </Portal>
);
