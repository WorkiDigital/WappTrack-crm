# WappTrack Insights Hub

Um sistema completo de gestão de leads e campanhas de WhatsApp com integração ao Supabase.

## Funcionalidades

- 📊 Dashboard com métricas em tempo real
- 👥 Gestão de leads e contactos
- 📱 Campanhas de WhatsApp
- 💰 Acompanhamento de vendas
- ⚙️ Configurações personalizáveis
- 🔐 Sistema de autenticação seguro
- 🌐 Acesso partilhado com tokens

## Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Base de dados + Autenticação)
- **Roteamento**: React Router DOM
- **Estado**: React Query (TanStack Query)
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Supabase

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/frigorificooeron/wapptrack-insights-hub-79.git
cd wapptrack-insights-hub-79
```

2. Instale as dependências:
```bash
# Com npm
npm install

# Com bun (recomendado)
bun install
```

3. Configure as variáveis de ambiente:
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o arquivo .env.local com suas credenciais do Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
# Com npm
npm run dev

# Com bun
bun run dev
```

## Scripts Disponíveis

- `dev` - Inicia o servidor de desenvolvimento
- `build` - Constrói a aplicação para produção
- `build:dev` - Constrói a aplicação em modo desenvolvimento
- `lint` - Executa o linter ESLint
- `preview` - Visualiza a build de produção

## Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── context/        # Contextos React (Auth, SharedAccess)
├── hooks/          # Hooks personalizados
├── integrations/   # Integrações externas (Supabase)
├── layouts/        # Layouts da aplicação
├── lib/            # Utilitários e configurações
├── pages/          # Páginas da aplicação
├── services/       # Serviços e APIs
└── types/          # Definições de tipos TypeScript
```

## Funcionalidades de Segurança

- ✅ Variáveis de ambiente para credenciais sensíveis
- ✅ Autenticação via Supabase
- ✅ Rotas protegidas
- ✅ Validação de formulários com Zod
- ✅ Tokens de acesso partilhado

## Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente no painel do Vercel
3. Deploy automático a cada push

### Outras Plataformas

A aplicação é compatível com qualquer plataforma que suporte aplicações React estáticas:
- Netlify
- GitHub Pages
- Firebase Hosting

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Para suporte, entre em contacto através do email: suporte@wapptrack.com
