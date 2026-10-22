import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Box,
  Button,
  CloseButton,
  Drawer,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react';
import { LuBlocks, LuBuilding2, LuChevronDown, LuLogOut, LuMenu } from 'react-icons/lu';
import { authService } from '@/services/authService';

const NAV = [
  { to: '/empresas', label: 'Empresas', icon: <LuBuilding2 /> },
  { to: '/modulos', label: 'Catálogo de módulos', icon: <LuBlocks /> },
];

const SidebarContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => (
  <Flex direction="column" h="full" bg="sidebar.bg" color="white">
    <Box px="6" py="6" borderBottomWidth="1px" borderColor="sidebar.border">
      <Text fontSize="2xl" fontWeight="bold" letterSpacing="tight">
        POWP
      </Text>
      <Text fontSize="xs" color="whiteAlpha.700" textTransform="uppercase" letterSpacing="widest">
        Painel da plataforma
      </Text>
    </Box>
    <Stack as="nav" gap="1" px="3" py="6" aria-label="Navegação principal">
      {NAV.map((item) => (
        <NavLink key={item.to} to={item.to} onClick={onNavigate}>
          {({ isActive }) => (
            <HStack
              gap="3"
              px="3"
              py="2.5"
              borderRadius="md"
              fontSize="sm"
              fontWeight="medium"
              color={isActive ? 'white' : 'whiteAlpha.800'}
              bg={isActive ? 'whiteAlpha.200' : 'transparent'}
              borderLeftWidth="3px"
              borderColor={isActive ? 'sidebar.accent' : 'transparent'}
              _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              transition="background 0.15s"
            >
              <Box fontSize="lg">{item.icon}</Box>
              {item.label}
            </HStack>
          )}
        </NavLink>
      ))}
    </Stack>
  </Flex>
);

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const nome = user?.nome || user?.usuario || 'Administrador';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  return (
    <Flex minH="100vh">
      <Box as="aside" w="64" flexShrink={0} display={{ base: 'none', lg: 'block' }} position="sticky" top="0" h="100vh">
        <SidebarContent />
      </Box>

      <Drawer.Root open={drawerOpen} onOpenChange={(e) => setDrawerOpen(e.open)} placement="start">
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content maxW="64">
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" color="white" aria-label="Fechar menu" />
              </Drawer.CloseTrigger>
              <SidebarContent onNavigate={() => setDrawerOpen(false)} />
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Box flex="1" minW="0">
        <Flex
          as="header"
          align="center"
          gap="4"
          px={{ base: '4', md: '0' }}
          py="4"
          borderBottomWidth="1px"
          borderColor="border.muted"
          mx={{ base: '0', md: '8' }}
        >
          <IconButton
            variant="ghost"
            aria-label="Abrir menu"
            display={{ base: 'inline-flex', lg: 'none' }}
            onClick={() => setDrawerOpen(true)}
          >
            <LuMenu />
          </IconButton>
          <Box flex="1" />
          <Menu.Root positioning={{ placement: 'bottom-end' }}>
            <Menu.Trigger asChild>
              <Button variant="outline" bg="bg" gap="2" px="3" aria-label="Menu do usuário">
                <Avatar.Root size="xs" colorPalette="brand">
                  <Avatar.Fallback name={nome} />
                </Avatar.Root>
                <Text display={{ base: 'none', sm: 'block' }}>{nome}</Text>
                <LuChevronDown />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Box px="3" py="2">
                    <Text fontWeight="medium">{nome}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      Administrador da plataforma
                    </Text>
                  </Box>
                  <Menu.Separator />
                  <Menu.Item value="sair" onSelect={handleLogout}>
                    <LuLogOut />
                    Sair
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>

        <Box as="main" px={{ base: '4', md: '8' }} py="8" maxW="96rem" w="full" mx="auto">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};
