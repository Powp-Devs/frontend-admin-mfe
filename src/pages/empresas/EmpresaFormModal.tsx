import React, { FormEvent, useState } from 'react';
import { Button, Field, Fieldset, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { Empresa, EmpresaCreate, EmpresaUpdate } from '@/types';
import { FormDialog, InlineError } from '@/components/ui';

interface Props {
  empresa?: Empresa;
  saving: boolean;
  error: string | null;
  onCreate: (data: EmpresaCreate) => void;
  onUpdate: (codempresa: number, data: EmpresaUpdate) => void;
  onClose: () => void;
}

const passwordBytes = (senha: string) => new TextEncoder().encode(senha).length;

// Cadastro cria empresa, schema, tabelas, parâmetros e o primeiro administrador
// numa única transação. Edição envia só os campos que mudaram.
export const EmpresaFormModal: React.FC<Props> = ({ empresa, saving, error, onCreate, onUpdate, onClose }) => {
  const [form, setForm] = useState({
    empresa: empresa?.empresa ?? '',
    fantasia: empresa?.fantasia ?? '',
    cnpj: empresa?.cnpj ?? '',
    obs: empresa?.obs ?? '',
    usuario: '',
    email: '',
    senha: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const obs = form.obs.trim() || null;

    if (empresa) {
      const changes: EmpresaUpdate = {};
      if (form.empresa.trim() !== empresa.empresa) changes.empresa = form.empresa.trim();
      if (form.fantasia.trim() !== empresa.fantasia) changes.fantasia = form.fantasia.trim();
      if (form.cnpj.trim() !== empresa.cnpj) changes.cnpj = form.cnpj.trim();
      if (obs !== (empresa.obs ?? null)) changes.obs = obs;
      if (Object.keys(changes).length === 0) return onClose();
      return onUpdate(empresa.codempresa, changes);
    }

    const bytes = passwordBytes(form.senha);
    if (bytes < 8 || bytes > 72) {
      setLocalError('A senha do administrador deve ter entre 8 e 72 bytes.');
      return;
    }
    onCreate({
      empresa: form.empresa.trim(),
      fantasia: form.fantasia.trim(),
      cnpj: form.cnpj.trim(),
      obs,
      administrador: { usuario: form.usuario.trim(), email: form.email.trim(), senha: form.senha },
    });
  };

  return (
    <FormDialog
      open
      title={empresa ? `Editar empresa #${empresa.codempresa}` : 'Nova empresa'}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" colorPalette="brand" loading={saving}>
            {empresa ? 'Salvar alterações' : 'Cadastrar empresa'}
          </Button>
        </>
      }
    >
      {(localError || error) && <InlineError>{localError || error}</InlineError>}
      <Field.Root required>
        <Field.Label>Razão social</Field.Label>
        <Input value={form.empresa} onChange={set('empresa')} maxLength={255} />
      </Field.Root>
      <Stack direction={{ base: 'column', sm: 'row' }} gap="4">
        <Field.Root required>
          <Field.Label>Nome fantasia</Field.Label>
          <Input value={form.fantasia} onChange={set('fantasia')} maxLength={255} />
        </Field.Root>
        <Field.Root required>
          <Field.Label>CNPJ</Field.Label>
          <Input value={form.cnpj} onChange={set('cnpj')} maxLength={20} />
        </Field.Root>
      </Stack>
      <Field.Root>
        <Field.Label>Observação</Field.Label>
        <Textarea value={form.obs} onChange={set('obs')} maxLength={255} rows={2} />
      </Field.Root>

      {!empresa && (
        <Fieldset.Root borderWidth="1px" borderRadius="lg" p="4">
          <Fieldset.Legend fontWeight="semibold" px="1">
            Primeiro administrador da empresa
          </Fieldset.Legend>
          <Fieldset.Content gap="4">
            <Field.Root required>
              <Field.Label>Login</Field.Label>
              <Input value={form.usuario} onChange={set('usuario')} maxLength={255} autoComplete="off" />
            </Field.Root>
            <Field.Root required>
              <Field.Label>E-mail</Field.Label>
              <Input type="email" value={form.email} onChange={set('email')} maxLength={255} autoComplete="off" />
            </Field.Root>
            <Field.Root required>
              <Field.Label>Senha</Field.Label>
              <Input type="password" value={form.senha} onChange={set('senha')} autoComplete="new-password" />
              <Field.HelperText>Entre 8 e 72 bytes.</Field.HelperText>
            </Field.Root>
          </Fieldset.Content>
          <Text fontSize="xs" color="fg.muted">
            A empresa nasce sem módulos liberados. Libere ao menos “Usuários” para o administrador cadastrar a equipe.
          </Text>
        </Fieldset.Root>
      )}
    </FormDialog>
  );
};
