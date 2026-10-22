import React, { FormEvent, useState } from 'react';
import { Button, Field, Input, Text } from '@chakra-ui/react';
import { Empresa } from '@/types';
import { FormDialog, InlineError } from '@/components/ui';

interface Props {
  empresa: Empresa;
  saving: boolean;
  error: string | null;
  onConfirm: (motivo: string) => void;
  onClose: () => void;
}

export const BloqueioModal: React.FC<Props> = ({ empresa, saving, error, onConfirm, onClose }) => {
  const [motivo, setMotivo] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfirm(motivo);
  };

  return (
    <FormDialog
      open
      title={`Bloquear ${empresa.fantasia}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" colorPalette="red" loading={saving}>
            Bloquear empresa
          </Button>
        </>
      }
    >
      {error && <InlineError>{error}</InlineError>}
      <Text color="fg.muted">
        O bloqueio impede novos logins e invalida as sessões abertas de todos os usuários da empresa. Ao liberar, eles
        precisarão entrar novamente.
      </Text>
      <Field.Root>
        <Field.Label>Motivo</Field.Label>
        <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={255} />
      </Field.Root>
    </FormDialog>
  );
};
