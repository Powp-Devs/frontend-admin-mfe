import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, Checkbox, Flex, Input, InputGroup, NativeSelect, Spinner, Table, Text } from '@chakra-ui/react';
import { LuBan, LuBlocks, LuLockOpen, LuPencil, LuPlus, LuRotateCcw, LuSearch, LuTrash2 } from 'react-icons/lu';
import { companyService } from '@/services/companyService';
import { Empresa, EmpresaCreate, EmpresaUpdate, SimNao } from '@/types';
import { getApiErrorMessage } from '@/utils/apiError';
import {
  CompanyStatus,
  ConfirmDialog,
  DataCard,
  DataTable,
  EmptyRow,
  Identity,
  InlineError,
  PageHeader,
  PaginationBar,
  RowAction,
  RowActions,
} from '@/components/ui';
import { notify } from '@/components/toaster';
import { EmpresaFormModal } from './EmpresaFormModal';
import { BloqueioModal } from './BloqueioModal';

const PER_PAGE = 20;

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit' | 'block' | 'unblock' | 'delete' | 'restore'; empresa: Empresa }
  | null;

const COLUMNS = [
  { label: 'Empresa' },
  { label: 'CNPJ' },
  { label: 'Situação' },
  { label: 'Schema' },
  { label: 'Cadastro' },
  { label: '', align: 'end' as const },
];

const formatDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');

const EmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // A busca fica na URL (?busca=), permitindo compartilhar e voltar ao filtro.
  const [searchParams, setSearchParams] = useSearchParams();
  const busca = searchParams.get('busca') ?? '';
  const [buscaInput, setBuscaInput] = useState(busca);
  const [page, setPage] = useState(1);
  const [bloqueio, setBloqueio] = useState<SimNao | ''>('');
  const [incluirExcluidas, setIncluirExcluidas] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    setBuscaInput(busca);
    setPage(1);
  }, [busca]);

  const filtros = { page, per_page: PER_PAGE, busca, bloqueio: bloqueio || undefined, incluir_excluidas: incluirExcluidas };
  const query = useQuery({
    queryKey: ['empresas', filtros],
    queryFn: () => companyService.listar(filtros),
    placeholderData: keepPreviousData,
  });

  const done = (title: string, description?: string) => {
    setDialog(null);
    notify.success(title, description);
    queryClient.invalidateQueries({ queryKey: ['empresas'] });
  };
  const fail = (err: unknown) => notify.error('Operação não concluída', getApiErrorMessage(err));

  const create = useMutation({
    mutationFn: (data: EmpresaCreate) => companyService.cadastrar(data),
    onSuccess: (e) => done(`Empresa “${e.fantasia}” criada`, 'Ela nasce sem módulos: libere os módulos contratados.'),
  });
  const update = useMutation({
    mutationFn: ({ cod, data }: { cod: number; data: EmpresaUpdate }) => companyService.atualizar(cod, data),
    onSuccess: (e) => done(`Empresa “${e.fantasia}” atualizada`),
  });
  const block = useMutation({
    mutationFn: ({ cod, bloqueio: b, motivo }: { cod: number; bloqueio: SimNao; motivo?: string }) =>
      companyService.definirBloqueio(cod, b, motivo),
    onSuccess: (e) =>
      done(
        e.bloqueio === 'S' ? `Empresa “${e.fantasia}” bloqueada` : `Empresa “${e.fantasia}” liberada`,
        e.bloqueio === 'N' ? 'Os usuários precisam entrar novamente.' : undefined
      ),
  });
  const remove = useMutation({
    mutationFn: (empresa: Empresa) => companyService.excluir(empresa.codempresa),
    onSuccess: (_, e) => done(`Empresa “${e.fantasia}” excluída`, 'Schema e dados foram preservados.'),
    onError: fail,
  });
  const restore = useMutation({
    mutationFn: (empresa: Empresa) => companyService.restaurar(empresa.codempresa),
    onSuccess: (e) => done(`Empresa “${e.fantasia}” restaurada`, 'Ela continua bloqueada até ser liberada.'),
    onError: fail,
  });

  // Limpa erros de uma tentativa anterior ao abrir ou fechar um diálogo.
  const openDialog = (next: Dialog) => {
    create.reset();
    update.reset();
    block.reset();
    setDialog(next);
  };
  const closeDialog = () => openDialog(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const termo = buscaInput.trim();
    setSearchParams(termo ? { busca: termo } : {});
    setPage(1);
  };

  const actionsFor = (empresa: Empresa): RowAction[] => {
    const modulos = { label: 'Módulos', icon: <LuBlocks />, onSelect: () => navigate(`/empresas/${empresa.codempresa}/modulos`) };
    if (empresa.excluida) {
      return [modulos, { label: 'Restaurar', icon: <LuRotateCcw />, onSelect: () => openDialog({ kind: 'restore', empresa }) }];
    }
    return [
      modulos,
      { label: 'Editar', icon: <LuPencil />, onSelect: () => openDialog({ kind: 'edit', empresa }) },
      empresa.bloqueio === 'S'
        ? { label: 'Liberar acesso', icon: <LuLockOpen />, onSelect: () => openDialog({ kind: 'unblock', empresa }) }
        : { label: 'Bloquear', icon: <LuBan />, onSelect: () => openDialog({ kind: 'block', empresa }) },
      { label: 'Excluir', icon: <LuTrash2 />, danger: true, onSelect: () => openDialog({ kind: 'delete', empresa }) },
    ];
  };

  const data = query.data;
  const alvo = dialog && dialog.kind !== 'create' ? dialog.empresa : null;

  return (
    <>
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas cadastradas, o acesso e os módulos liberados."
        actions={
          <Button colorPalette="brand" onClick={() => openDialog({ kind: 'create' })}>
            <LuPlus /> Nova empresa
          </Button>
        }
      />

      <Flex as="form" onSubmit={handleSearch} gap="3" mb="6" wrap="wrap" align="center">
        <InputGroup startElement={<LuSearch />} flex="1" minW="64" maxW="md">
          <Input
            bg="bg"
            placeholder="Buscar por nome, fantasia ou CNPJ..."
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            maxLength={255}
            aria-label="Buscar empresas"
          />
        </InputGroup>
        <NativeSelect.Root w="48" bg="bg">
          <NativeSelect.Field
            aria-label="Filtrar por situação"
            value={bloqueio}
            onChange={(e) => {
              setBloqueio(e.target.value as SimNao | '');
              setPage(1);
            }}
          >
            <option value="">Todas as situações</option>
            <option value="N">Ativas</option>
            <option value="S">Bloqueadas</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        <Checkbox.Root
          checked={incluirExcluidas}
          onCheckedChange={(e) => {
            setIncluirExcluidas(!!e.checked);
            setPage(1);
          }}
          colorPalette="brand"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Incluir excluídas</Checkbox.Label>
        </Checkbox.Root>
        <Button type="submit" variant="outline" bg="bg">
          Buscar
        </Button>
        {query.isFetching && <Spinner size="sm" color="brand.solid" />}
      </Flex>

      {query.isError && <InlineError>{getApiErrorMessage(query.error, 'Não foi possível carregar as empresas.')}</InlineError>}

      <DataCard>
        <DataTable columns={COLUMNS}>
          {query.isPending && <EmptyRow colSpan={COLUMNS.length}>Carregando empresas...</EmptyRow>}
          {data && data.empresas.length === 0 && <EmptyRow colSpan={COLUMNS.length}>Nenhuma empresa encontrada.</EmptyRow>}
          {data?.empresas.map((empresa) => (
            <Table.Row key={empresa.codempresa} data-testid={`empresa-${empresa.codempresa}`}>
              <Table.Cell>
                <Identity title={empresa.fantasia} subtitle={empresa.empresa} />
              </Table.Cell>
              <Table.Cell color="fg.muted">{empresa.cnpj}</Table.Cell>
              <Table.Cell>
                <CompanyStatus empresa={empresa} />
                {empresa.bloqueio === 'S' && empresa.motivo_bloqueio && (
                  <Text fontSize="xs" color="fg.muted" mt="1">
                    {empresa.motivo_bloqueio}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell color="fg.muted" fontFamily="mono" fontSize="sm">
                {empresa.schema_name}
              </Table.Cell>
              <Table.Cell color="fg.muted">{formatDate(empresa.data_cadastro)}</Table.Cell>
              <Table.Cell textAlign="end">
                <RowActions label={empresa.fantasia} actions={actionsFor(empresa)} />
              </Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
        {data && data.total > 0 && <PaginationBar page={data.page} perPage={data.per_page} total={data.total} onChange={setPage} />}
      </DataCard>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <EmpresaFormModal
          empresa={dialog.kind === 'edit' ? dialog.empresa : undefined}
          saving={create.isPending || update.isPending}
          error={create.error || update.error ? getApiErrorMessage(create.error || update.error) : null}
          onCreate={(d) => create.mutate(d)}
          onUpdate={(cod, d) => update.mutate({ cod, data: d })}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'block' && (
        <BloqueioModal
          empresa={dialog.empresa}
          saving={block.isPending}
          error={block.error ? getApiErrorMessage(block.error) : null}
          onConfirm={(motivo) => block.mutate({ cod: dialog.empresa.codempresa, bloqueio: 'S', motivo })}
          onClose={closeDialog}
        />
      )}
      <ConfirmDialog
        open={dialog?.kind === 'unblock'}
        title="Liberar acesso"
        description={`Liberar o acesso de “${alvo?.fantasia ?? ''}”? Os usuários precisarão entrar novamente.`}
        confirmLabel="Liberar acesso"
        loading={block.isPending}
        onConfirm={() => alvo && block.mutate({ cod: alvo.codempresa, bloqueio: 'N' }, { onError: fail })}
        onClose={closeDialog}
      />
      <ConfirmDialog
        open={dialog?.kind === 'delete'}
        title="Excluir empresa"
        description={
          <Box>
            Excluir “{alvo?.fantasia}”? O acesso é bloqueado e as sessões são encerradas. Schema, usuários e dados ficam
            preservados e a empresa pode ser restaurada depois.
          </Box>
        }
        confirmLabel="Excluir"
        danger
        loading={remove.isPending}
        onConfirm={() => alvo && remove.mutate(alvo)}
        onClose={closeDialog}
      />
      <ConfirmDialog
        open={dialog?.kind === 'restore'}
        title="Restaurar empresa"
        description="A empresa volta para a lista, mas continua bloqueada. Libere o acesso em seguida."
        confirmLabel="Restaurar"
        loading={restore.isPending}
        onConfirm={() => alvo && restore.mutate(alvo)}
        onClose={closeDialog}
      />
    </>
  );
};

export default EmpresasPage;
