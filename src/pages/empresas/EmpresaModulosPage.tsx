import React, { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, Button, HStack, Link, SimpleGrid, Stat, Switch, Table, Text } from '@chakra-ui/react';
import { LuArrowLeft, LuCheckCheck, LuGitBranch } from 'react-icons/lu';
import { companyService } from '@/services/companyService';
import { moduleService } from '@/services/moduleService';
import { EmpresaModulo, SimNao } from '@/types';
import { getApiErrorMessage } from '@/utils/apiError';
import { globallyInactiveDependencies, keysToGrant, pendingLabel } from '@/utils/modules';
import {
  CompanyStatus,
  ConfirmDialog,
  DataCard,
  DataTable,
  EmptyRow,
  Identity,
  InlineError,
  InlineInfo,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { notify } from '@/components/toaster';

const COLUMNS = [
  { label: 'Módulo' },
  { label: 'Catálogo' },
  { label: 'Liberação' },
  { label: 'Acesso efetivo' },
  { label: 'Última alteração' },
  { label: '', align: 'end' as const },
];

type Confirm = { kind: 'revoke'; modulo: EmpresaModulo } | { kind: 'all'; chaves: string[] } | null;

const EmpresaModulosPage: React.FC = () => {
  const codempresa = Number(useParams().codempresa);
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const modulesKey = ['empresas', codempresa, 'modulos'];

  const empresa = useQuery({ queryKey: ['empresas', codempresa], queryFn: () => companyService.buscar(codempresa) });
  const modulos = useQuery({ queryKey: modulesKey, queryFn: () => moduleService.listarDaEmpresa(codempresa) });

  // PUTs em sequência: o backend não libera dependências automaticamente.
  const setLinks = useMutation({
    mutationFn: async ({ chaves, ativo }: { chaves: string[]; ativo: SimNao; label: string; aviso?: string }) => {
      for (const chave of chaves) await moduleService.definirLiberacao(codempresa, chave, ativo);
    },
    onSuccess: (_, { label, aviso }) => {
      setConfirm(null);
      notify.success(label);
      if (aviso) notify.info('Liberado, mas sem acesso', aviso);
    },
    onError: (err) => notify.error('Liberação não concluída', getApiErrorMessage(err)),
    // Mesmo após falha parcial, recarrega para mostrar o estado real.
    onSettled: () => queryClient.invalidateQueries({ queryKey: modulesKey }),
  });

  const lista = modulos.data ?? [];
  const nome = (chave: string) => lista.find((m) => m.chave === chave)?.modulo ?? chave;

  const grant = (modulo: EmpresaModulo, withDependencies: boolean) => {
    const chaves = withDependencies ? keysToGrant(modulo, lista) : [modulo.chave];
    const inativas = globallyInactiveDependencies(modulo, lista);
    setLinks.mutate({
      chaves,
      ativo: 'S',
      label: chaves.length > 1 ? `Liberados: ${chaves.map(nome).join(', ')}.` : `Módulo “${modulo.modulo}” liberado.`,
      aviso: inativas.length ? `${inativas.map(nome).join(', ')} está desativado no catálogo.` : undefined,
    });
  };

  const naoLiberados = lista.filter((m) => m.ativo_empresa !== 'S').map((m) => m.chave);
  const comAcesso = lista.filter((m) => m.acesso_permitido).length;
  const liberadosSemAcesso = lista.filter((m) => m.ativo_empresa === 'S' && !m.acesso_permitido).length;
  const busy = setLinks.isPending;

  return (
    <>
      <Link asChild color="fg.muted" fontSize="sm" mb="4" display="inline-flex" gap="1">
        <RouterLink to="/empresas">
          <LuArrowLeft /> Empresas
        </RouterLink>
      </Link>
      <PageHeader
        title={
          <>
            {empresa.data ? empresa.data.fantasia : `Empresa #${codempresa}`}
            {empresa.data && <CompanyStatus empresa={empresa.data} />}
          </>
        }
        description="Libere os módulos contratados. Mudanças valem na próxima requisição dos usuários, sem novo login."
        actions={
          <Button
            variant="outline"
            bg="bg"
            disabled={busy || naoLiberados.length === 0}
            onClick={() => setConfirm({ kind: 'all', chaves: naoLiberados })}
          >
            <LuCheckCheck /> Liberar todos
          </Button>
        }
      />

      {empresa.data?.bloqueio === 'S' && (
        <InlineInfo>A empresa está bloqueada: nenhum módulo tem acesso efetivo até ela ser liberada, mesmo com liberação ativa.</InlineInfo>
      )}
      {(empresa.isError || modulos.isError) && (
        <InlineError>{getApiErrorMessage(empresa.error || modulos.error, 'Não foi possível carregar os módulos da empresa.')}</InlineError>
      )}

      {modulos.data && (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4" mb="6">
          {[
            { label: 'Com acesso efetivo', value: `${comAcesso} de ${lista.length}` },
            { label: 'Liberados sem acesso', value: liberadosSemAcesso, help: 'Dependência pendente ou desativada' },
            { label: 'Não liberados', value: naoLiberados.length },
          ].map((s) => (
            <Box key={s.label} bg="bg" borderRadius="xl" borderWidth="1px" borderColor="border.muted" p="5">
              <Stat.Root>
                <Stat.Label>{s.label}</Stat.Label>
                <Stat.ValueText>{s.value}</Stat.ValueText>
                {s.help && <Stat.HelpText>{s.help}</Stat.HelpText>}
              </Stat.Root>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <DataCard>
        <DataTable columns={COLUMNS}>
          {modulos.isPending && <EmptyRow colSpan={COLUMNS.length}>Carregando módulos...</EmptyRow>}
          {modulos.data?.map((modulo) => {
            const pendentes = pendingLabel(modulo, lista);
            const precisaDependencias = keysToGrant(modulo, lista).some((c) => c !== modulo.chave);
            const liberado = modulo.ativo_empresa === 'S';
            return (
              <Table.Row key={modulo.chave} data-testid={`modulo-${modulo.chave}`}>
                <Table.Cell>
                  <Identity
                    title={modulo.modulo}
                    subtitle={
                      <>
                        {modulo.chave}
                        {modulo.exibir_modulo === 'N' && ' · fora do menu'}
                      </>
                    }
                  />
                </Table.Cell>
                <Table.Cell>
                  {modulo.ativo === 'S' ? <StatusBadge tone="ok">Ativo</StatusBadge> : <StatusBadge tone="off">Desativado</StatusBadge>}
                </Table.Cell>
                <Table.Cell>
                  <Switch.Root
                    colorPalette="brand"
                    checked={liberado}
                    disabled={busy}
                    onCheckedChange={(e) => (e.checked ? grant(modulo, false) : setConfirm({ kind: 'revoke', modulo }))}
                  >
                    <Switch.HiddenInput aria-label={`Liberação de ${modulo.modulo}`} />
                    <Switch.Control />
                    <Switch.Label fontSize="sm" color="fg.muted">
                      {liberado ? 'Liberado' : 'Não liberado'}
                    </Switch.Label>
                  </Switch.Root>
                </Table.Cell>
                <Table.Cell>
                  {modulo.acesso_permitido ? <StatusBadge tone="ok">Sim</StatusBadge> : <StatusBadge tone="warn">Não</StatusBadge>}
                  {!modulo.acesso_permitido && pendentes && (
                    <Text fontSize="xs" color="fg.muted" mt="1" whiteSpace="normal" maxW="56">
                      Pendentes: {pendentes}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell fontSize="sm" color="fg.muted">
                  {modulo.data_alteracao && modulo.alterado_por !== null ? (
                    <>
                      {new Date(modulo.data_alteracao).toLocaleString('pt-BR')}
                      <Text fontSize="xs">usuário #{modulo.alterado_por}</Text>
                    </>
                  ) : (
                    '—'
                  )}
                </Table.Cell>
                <Table.Cell textAlign="end">
                  {precisaDependencias && (
                    <HStack justify="end">
                      <Button size="xs" colorPalette="brand" disabled={busy} onClick={() => grant(modulo, true)}>
                        <LuGitBranch /> Liberar com dependências
                      </Button>
                    </HStack>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </DataTable>
      </DataCard>

      <ConfirmDialog
        open={confirm?.kind === 'revoke'}
        title="Bloquear módulo"
        description={`Bloquear “${confirm?.kind === 'revoke' ? confirm.modulo.modulo : ''}” para esta empresa? Módulos que dependem dele também deixam de funcionar a partir da próxima requisição dos usuários.`}
        confirmLabel="Bloquear módulo"
        danger
        loading={busy}
        onConfirm={() =>
          confirm?.kind === 'revoke' &&
          setLinks.mutate({ chaves: [confirm.modulo.chave], ativo: 'N', label: `Módulo “${confirm.modulo.modulo}” bloqueado.` })
        }
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'all'}
        title="Liberar todos os módulos"
        description={`Liberar os ${confirm?.kind === 'all' ? confirm.chaves.length : 0} módulos ainda não liberados para esta empresa?`}
        confirmLabel="Liberar todos"
        loading={busy}
        onConfirm={() =>
          confirm?.kind === 'all' && setLinks.mutate({ chaves: confirm.chaves, ativo: 'S', label: 'Todos os módulos foram liberados.' })
        }
        onClose={() => setConfirm(null)}
      />
    </>
  );
};

export default EmpresaModulosPage;
