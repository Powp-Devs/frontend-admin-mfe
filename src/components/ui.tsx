import React from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  Portal,
  Square,
  Table,
  Text,
} from '@chakra-ui/react';
import { LuEllipsis } from 'react-icons/lu';
import { Empresa } from '@/types';

export const PageHeader: React.FC<{ title: React.ReactNode; description?: string; actions?: React.ReactNode }> = ({
  title,
  description,
  actions,
}) => (
  <Flex align={{ base: 'start', md: 'end' }} justify="space-between" gap="4" mb="6" direction={{ base: 'column', md: 'row' }}>
    <Box>
      <Heading as="h1" size="3xl" fontWeight="bold" letterSpacing="tight" display="flex" alignItems="center" gap="3" flexWrap="wrap">
        {title}
      </Heading>
      {description && (
        <Text color="fg.muted" mt="1">
          {description}
        </Text>
      )}
    </Box>
    {actions && <HStack gap="2">{actions}</HStack>}
  </Flex>
);

// Card branco que envolve as tabelas, como no layout de referência.
export const DataCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box bg="bg" borderRadius="xl" borderWidth="1px" borderColor="border.muted" boxShadow="xs" px={{ base: '3', md: '6' }} py="4">
    {children}
  </Box>
);

export const DataTable: React.FC<{ columns: { label: string; align?: 'start' | 'end' | 'center' }[]; children: React.ReactNode }> = ({
  columns,
  children,
}) => (
  <Table.ScrollArea>
    <Table.Root size="md" interactive>
      <Table.Header>
        <Table.Row bg="transparent">
          {columns.map((c, i) => (
            <Table.ColumnHeader
              key={c.label || i}
              textAlign={c.align ?? 'start'}
              color="fg.muted"
              fontSize="xs"
              fontWeight="medium"
              textTransform="uppercase"
              letterSpacing="wider"
              aria-label={c.label || 'Ações'}
            >
              {c.label}
            </Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>{children}</Table.Body>
    </Table.Root>
  </Table.ScrollArea>
);

export const EmptyRow: React.FC<{ colSpan: number; children: React.ReactNode }> = ({ colSpan, children }) => (
  <Table.Row>
    <Table.Cell colSpan={colSpan} textAlign="center" color="fg.muted" py="10">
      {children}
    </Table.Cell>
  </Table.Row>
);

const initialsOf = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

// Quadrado com iniciais + título e subtítulo, como a coluna "Company" da referência.
export const Identity: React.FC<{ title: string; subtitle?: React.ReactNode; icon?: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <HStack gap="3">
    <Square size="9" borderRadius="md" bg="brand.subtle" color="brand.fg" fontSize="xs" fontWeight="semibold" flexShrink={0}>
      {icon ?? initialsOf(title)}
    </Square>
    <Box minW="0">
      <Text fontWeight="medium" truncate>
        {title}
      </Text>
      {subtitle && (
        <Text fontSize="xs" color="fg.muted" truncate>
          {subtitle}
        </Text>
      )}
    </Box>
  </HStack>
);

export type Tone = 'ok' | 'warn' | 'off' | 'muted' | 'info';
const tonePalette: Record<Tone, string> = { ok: 'green', warn: 'orange', off: 'red', muted: 'gray', info: 'brand' };

export const StatusBadge: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <Badge colorPalette={tonePalette[tone]} variant="subtle" borderRadius="full" px="3" py="1" fontSize="sm" fontWeight="medium">
    {children}
  </Badge>
);

export const CompanyStatus: React.FC<{ empresa: Empresa }> = ({ empresa }) =>
  empresa.excluida ? (
    <StatusBadge tone="muted">Excluída</StatusBadge>
  ) : empresa.bloqueio === 'S' ? (
    <StatusBadge tone="off">Bloqueada</StatusBadge>
  ) : (
    <StatusBadge tone="ok">Ativa</StatusBadge>
  );

export interface RowAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}

// Menu "⋯" das linhas da tabela.
export const RowActions: React.FC<{ label: string; actions: RowAction[] }> = ({ label, actions }) => (
  <Menu.Root positioning={{ placement: 'bottom-end' }}>
    <Menu.Trigger asChild>
      <IconButton variant="ghost" size="sm" aria-label={`Ações de ${label}`}>
        <LuEllipsis />
      </IconButton>
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content minW="44">
          {actions.map((a) => (
            <Menu.Item key={a.label} value={a.label} onSelect={a.onSelect} color={a.danger ? 'fg.error' : undefined}>
              {a.icon}
              {a.label}
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu.Root>
);

export const InlineError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Alert.Root status="error" borderRadius="md" mb="4">
    <Alert.Indicator />
    <Alert.Description>{children}</Alert.Description>
  </Alert.Root>
);

export const InlineInfo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Alert.Root status="warning" borderRadius="md" mb="4">
    <Alert.Indicator />
    <Alert.Description>{children}</Alert.Description>
  </Alert.Root>
);

interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}

// Diálogo com formulário: o rodapé contém o botão submit.
export const FormDialog: React.FC<FormDialogProps> = ({ open, title, onClose, children, footer, onSubmit }) => (
  <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="md" placement="center">
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content as="form" onSubmit={onSubmit}>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body display="flex" flexDirection="column" gap="4">
            {children}
          </Dialog.Body>
          <Dialog.Footer>{footer}</Dialog.Footer>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" aria-label="Fechar" />
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onClose,
}) => (
  <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} role="alertdialog" size="sm" placement="center">
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body color="fg.muted">{description}</Dialog.Body>
          <Dialog.Footer>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button colorPalette={danger ? 'red' : 'brand'} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
);

export const PaginationBar: React.FC<{ page: number; perPage: number; total: number; onChange: (page: number) => void }> = ({
  page,
  perPage,
  total,
  onChange,
}) => {
  const pages = Math.max(1, Math.ceil(total / perPage));
  return (
    <Flex justify="space-between" align="center" pt="4" gap="3" wrap="wrap">
      <Text fontSize="sm" color="fg.muted">
        {total} registro{total === 1 ? '' : 's'} · página {page} de {pages}
      </Text>
      <HStack>
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Próxima
        </Button>
      </HStack>
    </Flex>
  );
};
