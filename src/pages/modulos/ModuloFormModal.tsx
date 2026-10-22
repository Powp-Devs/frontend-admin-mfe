import React, { FormEvent, useState } from 'react';
import { Button, Field, Input, NativeSelect, Stack, Text } from '@chakra-ui/react';
import { Modulo, ModuloCreate, ModuloUpdate, SimNao } from '@/types';
import { FormDialog, InlineError } from '@/components/ui';

// Mesmo padrão de ModuloCreate.chave no backend.
export const CHAVE_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

interface Props {
  modulo?: Modulo;
  saving: boolean;
  error: string | null;
  onCreate: (data: ModuloCreate) => void;
  onUpdate: (chave: string, data: ModuloUpdate) => void;
  onClose: () => void;
}

export const ModuloFormModal: React.FC<Props> = ({ modulo, saving, error, onCreate, onUpdate, onClose }) => {
  const [form, setForm] = useState<ModuloCreate>({
    chave: modulo?.chave ?? '',
    modulo: modulo?.modulo ?? '',
    descricao: modulo?.descricao ?? '',
    ativo: modulo?.ativo ?? 'S',
    exibir_modulo: modulo?.exibir_modulo ?? 'S',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const data = { ...form, chave: form.chave.trim(), modulo: form.modulo.trim(), descricao: form.descricao.trim() };

    if (!modulo) {
      if (!CHAVE_PATTERN.test(data.chave)) {
        setLocalError('A chave deve começar com letra minúscula e usar apenas letras minúsculas, números e _ (até 50).');
        return;
      }
      return onCreate(data);
    }

    const changes: ModuloUpdate = {};
    (['modulo', 'descricao', 'ativo', 'exibir_modulo'] as const).forEach((field) => {
      if (data[field] !== modulo[field]) (changes as Record<string, string>)[field] = data[field];
    });
    if (Object.keys(changes).length === 0) return onClose();
    onUpdate(modulo.chave, changes);
  };

  const yesNo = (field: 'ativo' | 'exibir_modulo', label: string, hint: string) => (
    <Field.Root>
      <Field.Label>{label}</Field.Label>
      <NativeSelect.Root>
        <NativeSelect.Field
          aria-label={label}
          value={form[field]}
          onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value as SimNao }))}
        >
          <option value="S">Sim</option>
          <option value="N">Não</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      <Field.HelperText>{hint}</Field.HelperText>
    </Field.Root>
  );

  return (
    <FormDialog
      open
      title={modulo ? `Editar módulo ${modulo.chave}` : 'Novo módulo'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" colorPalette="brand" loading={saving}>
            {modulo ? 'Salvar alterações' : 'Cadastrar módulo'}
          </Button>
        </>
      }
    >
      {(localError || error) && <InlineError>{localError || error}</InlineError>}
      <Field.Root required disabled={!!modulo}>
        <Field.Label>Chave</Field.Label>
        <Input value={form.chave} onChange={(e) => setForm((f) => ({ ...f, chave: e.target.value }))} maxLength={50} fontFamily="mono" />
        <Field.HelperText>
          {modulo ? 'A chave não pode ser alterada.' : 'Usada no código (require_module). Não pode ser alterada depois.'}
        </Field.HelperText>
      </Field.Root>
      <Field.Root required>
        <Field.Label>Nome</Field.Label>
        <Input value={form.modulo} onChange={(e) => setForm((f) => ({ ...f, modulo: e.target.value }))} maxLength={255} />
      </Field.Root>
      <Field.Root required>
        <Field.Label>Descrição</Field.Label>
        <Input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} maxLength={255} />
      </Field.Root>
      <Stack direction={{ base: 'column', sm: 'row' }} gap="4">
        {yesNo('ativo', 'Ativo no catálogo', 'Desativar bloqueia para todas as empresas.')}
        {yesNo('exibir_modulo', 'Exibir no menu', 'Oculto do menu não remove o acesso.')}
      </Stack>
      {!modulo && (
        <Text fontSize="xs" color="fg.muted">
          Cadastrar um módulo não cria rotas: o backend precisa usar require_module com esta chave.
        </Text>
      )}
    </FormDialog>
  );
};
