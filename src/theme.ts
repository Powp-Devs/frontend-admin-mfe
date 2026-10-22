import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Cores do POWP (frontend-react/src/styles/global.css e sidebar.css):
// marca #004d40, destaque #26a69a, sucesso #16A34A, alerta #D97706, perigo #e53935.
const config = defineConfig({
  globalCss: {
    'html, body': {
      bg: 'bg.canvas',
      color: 'fg',
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
        body: { value: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
      },
      colors: {
        brand: {
          50: { value: '#e0f2f1' },
          100: { value: '#b2dfdb' },
          200: { value: '#80cbc4' },
          300: { value: '#4db6ac' },
          400: { value: '#26a69a' },
          500: { value: '#00897b' },
          600: { value: '#00796b' },
          700: { value: '#00695c' },
          800: { value: '#004d40' },
          900: { value: '#00332b' },
          950: { value: '#00241e' },
        },
      },
    },
    semanticTokens: {
      colors: {
        // colorPalette="brand" em botões, switches, badges etc.
        brand: {
          solid: { value: '{colors.brand.800}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.50}' },
          emphasized: { value: '{colors.brand.200}' },
          focusRing: { value: '{colors.brand.400}' },
        },
        bg: {
          canvas: { value: '#F3F4F6' },
        },
        sidebar: {
          bg: { value: '{colors.brand.800}' },
          border: { value: '{colors.brand.700}' },
          accent: { value: '{colors.brand.400}' },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
