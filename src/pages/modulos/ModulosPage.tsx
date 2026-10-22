import React, { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Table, Text } from '@chakra-ui/react';
import { LuPencil, LuPlus } from 'react-icons/lu';
import { moduleService } from '@/services/moduleService';
import { Modulo, ModuloCreate, ModuloUpdate } from '@/types';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  ConfirmDialog,
  DataCard,
  DataTable,
  EmptyRow,
  Identity,
  InlineError,
  PageHeader,
  PaginationBar,
  RowActions,
  StatusBadge,
} from '@/components/ui';
import { notify } from '@/components/toaster';
import { ModuloFormModal } from './ModuloFormModal';

const PER_PAGE = 50;

const COLUMNS = [{ label: 'Módulo' }, { label: 'Descrição' }, { label: 'Catálogo' }, { label: 'Menu' }, { label: '', align: 'end' as const }];

type Dialog = { kind: 'create' } | { kind: 'edit'; modulo: Modulo } | null;

const ModulosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog>(null);
  // Desativar no catálogo afeta todas as empresas: pede confirmação antes do PATCH.
  const [pendingDeactivation, setPendingDeactivation] = useState<{ chave: string; data: ModuloUpdate } | null>(null);

  const query = useQuery({
    queryKey: ['modulos', page],
    queryFn: () => moduleService.listarCatalogo(page, PER_PAGE),
    placeholderData: keepPreviousData,
  });

  const done = (title: string, description?: string) => {
    setDialog(null);
    setPendingDeactivation(null);
    notify.success(title, description);
    queryClient.invalidateQueries({ queryKey: ['modulos'] });
    // Status global muda o acesso efetivo exibido nas telas de empresa.
    queryClient.invalidateQueries({ queryKey: ['empresas'] });
  };

  const create = useMutation({
    mutationFn: (data: ModuloCreate) => moduleService.cadastrar(data),
    onSuccess: (m) => done(`Módulo “${m.modulo}” cadastrado`, 'Nenhuma empresa o recebe automaticamente.'),
  });
  const update = useMutation({
    mutationFn: ({ chave, data }: { chave: string; data: ModuloUpdate }) => moduleService.atualizar(chave, data),
    onSuccess: (m) => done(`Módulo “${m.modulo}” atualizado`),
    onError: (err) => pendingDeactivation && notify.error('Alteração não concluída', getApiErrorMessage(err)),
  });

  const requestUpdate = (chave: string, data: ModuloUpdate) =>
    data.ativo === 'N' ? setPendingDeactivation({ chave, data }) : update.mutate({ chave, data });

  const openDialog = (next: Dialog) => {
    create.reset();
    update.reset();
    setDialog(next);
  };

  const data = query.data;

  return (
    <>
      <PageHeader
        title="Catálogo de módulos"
        description="Catálogo global da plataforma. Não há exclusão: desative para preservar vínculos e chaves usadas no código."
        actions={
          <Button colorPalette="brand" onClick={() => openDialog({ kind: 'create' })}>
            <LuPlus /> Novo módulo
          </Button>
        }
      />

      {query.isError && <InlineError>{getApiErrorMessage(query.error, 'Não foi possível carregar o catálogo.')}</InlineError>}

      <DataCard>
        <DataTable columns={COLUMNS}>
          {query.isPending && <EmptyRow colSpan={COLUMNS.length}>Carregando módulos...</EmptyRow>}
          {data?.modulos.map((modulo) => (
            <Table.Row key={modulo.chave} data-testid={`catalogo-${modulo.chave}`}>
              <Table.Cell>
                <Identity title={modulo.modulo} subtitle={modulo.chave} />
              </Table.Cell>
              <Table.Cell>
                <Text color="fg.muted" fontSize="sm">
                  {modulo.descricao}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {modulo.ativo === 'S' ? <StatusBadge tone="ok">Ativo</StatusBadge> : <StatusBadge tone="off">Desativado</StatusBadge>}
              </Table.Cell>
              <Table.Cell>
                {modulo.exibir_modulo === 'S' ? <StatusBadge tone="info">Exibido</StatusBadge> : <StatusBadge tone="muted">Oculto</StatusBadge>}
              </Table.Cell>
              <Table.Cell textAlign="end">
                <RowActions
                  label={modulo.modulo}
                  actions={[{ label: 'Editar', icon: <LuPencil />, onSelect: () => openDialog({ kind: 'edit', modulo }) }]}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
        {data && data.total > 0 && <PaginationBar page={data.page} perPage={data.per_page} total={data.total} onChange={setPage} />}
      </DataCard>

      {dialog && (
        <ModuloFormModal
          modulo={dialog.kind === 'edit' ? dialog.modulo : undefined}
          saving={create.isPending || update.isPending}
          error={create.error || update.error ? getApiErrorMessage(create.error || update.error) : null}
          onCreate={(d) => create.mutate(d)}
          onUpdate={requestUpdate}
          onClose={() => openDialog(null)}
        />
      )}
      <ConfirmDialog
        open={!!pendingDeactivation}
        title="Desativar módulo"
        description="Desativar este módulo bloqueia o acesso a ele para TODAS as empresas, mesmo as que têm liberação ativa."
        confirmLabel="Desativar"
        danger
        loading={update.isPending}
        onConfirm={() => pendingDeactivation && update.mutate(pendingDeactivation)}
        onClose={() => setPendingDeactivation(null)}
      />
    </>
  );
};

export default ModulosPage;
