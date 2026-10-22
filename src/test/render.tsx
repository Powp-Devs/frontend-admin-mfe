import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createQueryClient, Providers } from '@/app/Providers';
import { toaster } from '@/components/toaster';
import { EmpresaModulo } from '@/types';

export interface Rendered {
  container: HTMLDivElement;
  unmount: () => void;
}

export const flush = (ms = 0) => act(async () => { await new Promise((resolve) => setTimeout(resolve, ms)); });

// Renderiza com Chakra, React Query e rotas, aguardando as queries iniciais.
export async function renderRoute(path: string, routes: { path: string; element: React.ReactNode }[]): Promise<Rendered> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Providers client={createQueryClient()}>
          <Routes>
            {routes.map((r) => (
              <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Routes>
        </Providers>
      </MemoryRouter>
    );
  });
  await flush();

  return {
    container,
    unmount: () => {
      act(() => toaster.remove());
      act(() => root.unmount());
      document.body.innerHTML = '';
    },
  };
}

// Menus, diálogos e toasts do Chakra são renderizados em portal no body.
export const body = () => document.body;

export const byText = (root: ParentNode, selector: string, text: string) =>
  Array.from(root.querySelectorAll(selector)).find((el) => el.textContent?.trim() === text) as HTMLElement | undefined;

export const byLabel = (label: string) => document.body.querySelector<HTMLElement>(`[aria-label="${label}"]`);

export async function click(el: Element | null | undefined) {
  if (!el) throw new Error('Elemento não encontrado');
  await act(async () => {
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }));
    (el as HTMLElement).click();
  });
  await flush(20);
}

let pointerX = 0;

// O zag (Chakra v3) destaca o item de menu no pointermove e o clique seleciona o
// item destacado; o destaque precisa ser renderizado antes do clique. O zag ignora
// pointermove na mesma coordenada do anterior, por isso cada movimento usa uma nova.
export async function selectMenuItem(item: Element | null | undefined) {
  if (!item) throw new Error('Item de menu não encontrado');
  pointerX += 7;
  await act(async () => {
    item.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: pointerX, clientY: pointerX }));
  });
  await flush(20);
  await act(async () => (item as HTMLElement).click());
  await flush(20);
}

export async function type(el: Element | null | undefined, value: string) {
  if (!el) throw new Error('Campo não encontrado');
  const input = el as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export async function submit(form: Element | null | undefined) {
  if (!form) throw new Error('Formulário não encontrado');
  await act(async () => (form as HTMLFormElement).requestSubmit());
  await flush(20);
}

/** Abre o menu "⋯" da linha e escolhe a ação. */
export async function rowAction(rowLabel: string, action: string) {
  await click(byLabel(`Ações de ${rowLabel}`));
  const item = byText(document.body, '[role="menuitem"]', action);
  if (!item) throw new Error(`Ação "${action}" não encontrada no menu de ${rowLabel}`);
  await selectMenuItem(item);
}

export const openDialog = () => document.body.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]');

export const moduloDaEmpresa = (chave: string, overrides: Partial<EmpresaModulo> = {}): EmpresaModulo => ({
  codmodulo: 1,
  chave,
  modulo: chave.charAt(0).toUpperCase() + chave.slice(1),
  descricao: chave,
  ativo: 'S',
  exibir_modulo: 'S',
  data_criacao: '2026-10-21T00:00:00Z',
  ativo_empresa: 'N',
  acesso_permitido: false,
  modulos_pendentes: [chave],
  alterado_por: null,
  data_alteracao: null,
  ...overrides,
});
