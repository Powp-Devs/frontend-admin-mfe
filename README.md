# POWP · Painel da Plataforma

Painel para o **administrador da plataforma** (`admin_plataforma = true`) gerenciar
empresas, o catálogo de módulos e as liberações de módulos por empresa. É um app
separado do ERP (`frontend-react`): React 18, TypeScript 5, Vite, React Router, Axios,
React Query e **Chakra UI v3** (ícones de `react-icons/lu`).

O tema fica em `src/theme.ts`, com as cores do POWP: marca `#004d40` (sidebar e
botões, `colorPalette="brand"`) e destaque `#26a69a`. Componentes visuais
compartilhados (cabeçalho de página, card de tabela, badges, menu "⋯", diálogos de
formulário e de confirmação, paginação) ficam em `src/components/ui.tsx`; os avisos
usam o toaster de `src/components/toaster.tsx`.

Contratos usados: `backEnd-python/docs/modulos-api.md` e
`backEnd-python/docs/painel-admin-empresas.md`.

## Rodar

```bash
npm install        # .npmrc já usa legacy-peer-deps, como o frontend principal
npm run dev        # http://localhost:3001
```

A API precisa estar em `http://127.0.0.1:8000`. Em desenvolvimento o Vite
encaminha `/api` para o backend (veja `vite.config.ts`), então **não é preciso
liberar CORS** no backend para a porta 3001. Para apontar para outro backend:

```bash
VITE_API_PROXY_TARGET=http://outro-host:8000 npm run dev
```

Em produção, sirva o build atrás do mesmo domínio da API (proxy reverso em `/api`)
ou defina `VITE_API_URL` com a URL completa e libere essa origem no CORS do backend.

## Acesso

Só entra quem tem `admin_plataforma = true`. Para conceder:

```bash
cd ../backEnd-python
python -m app.manage_tenants grant-platform-admin --usuario admin
```

Cada login invalida o token anterior do mesmo usuário. Entrar no painel com o
mesmo login usado no ERP encerra a sessão do ERP (e vice-versa).

## Telas

| Rota | Função |
| --- | --- |
| `/empresas` | Listar (busca, situação, excluídas), criar com primeiro administrador, editar, bloquear/liberar, excluir (lógico) e restaurar |
| `/empresas/:id/modulos` | Liberar/bloquear módulos da empresa, ver acesso efetivo e dependências pendentes, "Liberar com dependências" e "Liberar todos" |
| `/modulos` | Catálogo global: cadastrar módulo (chave imutável), editar nome, descrição, ativo e exibição no menu |

Regras que o painel respeita (definidas no backend):

- Empresa nova nasce **sem módulos**. Libere ao menos `usuarios` para o administrador da empresa cadastrar a equipe.
- O backend não libera dependências automaticamente; "Liberar com dependências" faz um PUT para cada módulo necessário.
- Desativar um módulo no catálogo bloqueia o acesso para todas as empresas.
- Restaurar uma empresa não libera o bloqueio; libere em seguida.
- Mudanças de liberação valem na próxima requisição dos usuários, sem novo login.

## Testes

```bash
npm test           # vitest (jsdom)
npm run type-check
```

`src/test/setup.ts` adiciona ao jsdom as APIs que o Chakra usa (`matchMedia`,
`ResizeObserver`, `PointerEvent`...). Menus e diálogos são renderizados em portal no
`document.body`; use os helpers de `src/test/render.tsx` (`rowAction`,
`selectMenuItem`, `openDialog`), que simulam o ponteiro como o Chakra espera.
