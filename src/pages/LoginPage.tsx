import React, { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Field, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { authService, NotPlatformAdminError } from '@/services/authService';
import { consumeSessionEndMessage } from '@/services/session';
import { getApiErrorMessage } from '@/utils/apiError';
import { InlineError } from '@/components/ui';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => consumeSessionEndMessage());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.login(usuario.trim(), senha);
      navigate('/empresas', { replace: true });
    } catch (err) {
      setError(err instanceof NotPlatformAdminError ? err.message : getApiErrorMessage(err, 'Erro no login. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" p="4" bgGradient="to-br" gradientFrom="brand.900" gradientTo="brand.700">
      <Box as="form" onSubmit={handleSubmit} bg="bg" borderRadius="2xl" boxShadow="xl" p={{ base: '6', md: '10' }} w="full" maxW="md">
        <Stack gap="6">
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="brand.fg" textTransform="uppercase" letterSpacing="widest">
              POWP
            </Text>
            <Heading as="h1" size="2xl" mt="1">
              Painel da plataforma
            </Heading>
            <Text color="fg.muted" mt="1">
              Acesso restrito a administradores da plataforma.
            </Text>
          </Box>

          {error && <InlineError>{error}</InlineError>}

          <Field.Root required>
            <Field.Label>Usuário ou e-mail</Field.Label>
            <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" />
          </Field.Root>
          <Field.Root required>
            <Field.Label>Senha</Field.Label>
            <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
          </Field.Root>

          <Button type="submit" colorPalette="brand" size="lg" loading={loading} loadingText="Entrando...">
            Entrar
          </Button>
          <Text fontSize="xs" color="fg.muted">
            Entrar aqui encerra a sessão deste usuário no ERP, pois o backend invalida o token anterior a cada login.
          </Text>
        </Stack>
      </Box>
    </Flex>
  );
};

export default LoginPage;
