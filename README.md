# 🔐 KeyManager

> Sistema completo de gerenciamento de licenças e chaves para aplicações, desenvolvido com uma arquitetura moderna, segura e escalável.

O **KeyManager** permite criar e administrar aplicações, gerar chaves de licença, controlar sessões, vincular dispositivos por HWID e acompanhar eventos através de logs.

---

## ✨ Recursos

* 🔑 Geração de chaves de licença
* 📦 Gerenciamento de aplicações
* 👤 Sistema de administradores
* 🖥️ Vinculação por HWID
* ⏱️ Controle de validade das licenças
* 🚫 Bloqueio e desativação de chaves
* 🔄 Controle de sessões
* 📊 Dashboard com estatísticas
* 📝 Sistema de logs
* 🔐 Autenticação com JWT
* 🔒 Senhas protegidas com bcrypt
* 🛡️ Rate limiting e Helmet
* 🌐 API REST
* 📱 Interface responsiva

---

# 🛠️ Tecnologias

## Frontend

* React 18
* TypeScript
* Vite
* Tailwind CSS
* React Router DOM
* Recharts
* Lucide React
* Axios
* React Hot Toast

## Backend

* Node.js
* TypeScript
* Express.js
* JWT
* bcryptjs
* Helmet
* CORS
* Rate Limiting

## Banco de Dados

O projeto utiliza um banco de dados relacional configurado no backend.

---

# 📋 Requisitos

Antes de começar, certifique-se de possuir:

* **Node.js 18 ou superior**
* **npm** ou **yarn**
* Banco de dados configurado para o projeto

---

# 🚀 Instalação

## 1. Clone o projeto

```bash
git clone <repository-url>
cd keymanager
```

---

## 2. Instale as dependências do Backend

```bash
cd backend
npm install
```

---

## 3. Instale as dependências do Frontend

```bash
cd ../frontend
npm install
```

---

# ⚙️ Configuração

Crie o arquivo `.env` dentro da pasta `backend`.

```env
JWT_SECRET=your-long-random-secret
PORT=3001
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Configure também as informações necessárias para conexão com o banco de dados utilizado pelo projeto.

> ⚠️ **Nunca publique arquivos `.env` ou chaves privadas no GitHub.**

Adicione ao `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
node_modules/
dist/
```

---

# ▶️ Executando o projeto

O backend e o frontend devem ser executados separadamente.

## Backend

```bash
cd backend
npm run dev
```

A API ficará disponível em:

```text
http://localhost:3001
```

## Frontend

Em outro terminal:

```bash
cd frontend
npm run dev
```

O painel ficará disponível em:

```text
http://localhost:5173
```

---

# 👑 Primeiro administrador

Depois de iniciar o sistema, crie o primeiro administrador utilizando o método de configuração disponibilizado pelo backend.

Dados de exemplo:

```text
email: admin@example.com
username: admin
password: sua-senha
role: superadmin
```

Depois disso, acesse:

```text
http://localhost:5173/login
```

---

# 📦 Criando uma aplicação

No painel administrativo:

1. Acesse **Applications**.
2. Clique em **New Application**.
3. Informe o nome da aplicação.
4. Informe a versão.
5. Salve.

A aplicação receberá:

* `app_id`
* `secret`

Essas informações serão utilizadas pela integração com a API.

---

# 🔑 Gerando chaves

Para criar novas licenças:

1. Acesse **Generate Keys**.
2. Selecione uma aplicação.
3. Escolha o plano.
4. Defina a duração.
5. Informe a quantidade de chaves.
6. Opcionalmente, defina um prefixo.
7. Clique em **Generate Keys**.

As chaves podem ser:

* Copiadas diretamente.
* Exportadas para `.txt`.
* Exportadas para `.csv`.

Exemplo:

```text
PRO-8X7K-29LM-4Q2P
PRO-92KD-7XPL-8M4A
PRO-5QZA-91MX-7K2L
```

---

# 🌐 API

A plataforma disponibiliza uma API REST para integração com aplicações externas.

## Autenticação

### `POST /api/auth/login`

Autentica uma licença.

### Request

```json
{
  "license": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "YOUR_HARDWARE_ID",
  "app_id": "app_xxxxxxxxxx"
}
```

### Resposta

```json
{
  "success": true,
  "message": "Authenticated",
  "expires_at": "2026-10-12T00:00:00Z",
  "remaining_time": 2592000,
  "session_token": "abc123..."
}
```

### Possíveis erros

```json
{
  "success": false,
  "error": "INVALID_LICENSE",
  "message": "License not found"
}
```

```json
{
  "success": false,
  "error": "LICENSE_EXPIRED",
  "message": "License has expired"
}
```

```json
{
  "success": false,
  "error": "LICENSE_BANNED",
  "message": "License has been banned"
}
```

```json
{
  "success": false,
  "error": "LICENSE_DISABLED",
  "message": "License has been disabled"
}
```

```json
{
  "success": false,
  "error": "HWID_MISMATCH",
  "message": "HWID does not match"
}
```

```json
{
  "success": false,
  "error": "INVALID_APPLICATION",
  "message": "Invalid or inactive application"
}
```

---

## Validar sessão

### `POST /api/auth/validate`

Valida uma sessão existente.

```json
{
  "license": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "YOUR_HARDWARE_ID"
}
```

---

## Encerrar sessão

### `POST /api/auth/logout`

```json
{
  "session_token": "token-from-login"
}
```

---

# 🔧 Endpoints administrativos

Todos os endpoints administrativos exigem autenticação JWT.

| Método | Endpoint                                  | Descrição                    |
| ------ | ----------------------------------------- | ---------------------------- |
| POST   | `/api/admin/login`                        | Login administrativo         |
| GET    | `/api/admin/me`                           | Informações do administrador |
| POST   | `/api/admin/logout`                       | Encerrar sessão              |
| POST   | `/api/admin/change-password`              | Alterar senha                |
| GET    | `/api/dashboard/stats`                    | Estatísticas do dashboard    |
| GET    | `/api/applications`                       | Listar aplicações            |
| POST   | `/api/applications`                       | Criar aplicação              |
| PUT    | `/api/applications/:id`                   | Atualizar aplicação          |
| POST   | `/api/applications/:id/regenerate-secret` | Gerar novo secret            |
| DELETE | `/api/applications/:id`                   | Remover aplicação            |
| GET    | `/api/licenses`                           | Listar licenças              |
| GET    | `/api/licenses/:id`                       | Detalhes da licença          |
| POST   | `/api/licenses/generate`                  | Gerar chaves                 |
| PUT    | `/api/licenses/:id/status`                | Alterar status               |
| POST   | `/api/licenses/:id/reset-hwid`            | Resetar HWID                 |
| DELETE | `/api/licenses/:id`                       | Remover licença              |
| GET    | `/api/sessions`                           | Listar sessões               |
| DELETE | `/api/sessions/:id`                       | Revogar sessão               |
| POST   | `/api/sessions/clean`                     | Limpar sessões expiradas     |
| GET    | `/api/logs`                               | Listar logs                  |

---

# 📊 Status das licenças

O ciclo padrão de uma licença:

```text
UNUSED
   ↓
ACTIVE
   ↓
EXPIRED
```

Uma licença também pode ser bloqueada ou desativada:

```text
ACTIVE
 ├──→ BANNED
 └──→ DISABLED
```

### Estados

**UNUSED**

A chave foi criada, mas ainda não foi utilizada.

**ACTIVE**

A chave foi ativada e ainda está dentro do período de validade.

**EXPIRED**

O período de validade terminou.

**BANNED**

A licença foi bloqueada por um administrador.

**DISABLED**

A licença foi desativada manualmente.

---

# 🖥️ Sistema HWID

O sistema utiliza HWID para vincular uma licença a um dispositivo.

Fluxo:

```text
Usuário envia licença + HWID
             ↓
     Licença possui HWID?
        ↙          ↘
      Não           Sim
       ↓             ↓
Vincula HWID    Compara HWID
                     ↓
              ┌──────┴──────┐
            Igual         Diferente
              ↓               ↓
        Autorizado       Acesso negado
```

Caso o dispositivo precise ser alterado, um administrador pode utilizar a função de **Reset HWID**.

---

# 📁 Estrutura do projeto

```text
keymanager/
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── pages/           # Páginas
│   │   ├── layouts/         # Layouts
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── services/        # Serviços da API
│   │   ├── types/           # Tipos TypeScript
│   │   ├── lib/             # Utilitários
│   │   ├── App.tsx          # Componente principal
│   │   ├── main.tsx         # Ponto de entrada
│   │   └── index.css        # Estilos globais
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/     # Controladores
│   │   ├── routes/          # Rotas
│   │   ├── middleware/      # Middlewares
│   │   ├── services/        # Regras de negócio
│   │   ├── database/        # Conexão com banco
│   │   ├── utils/           # Utilitários
│   │   ├── types.ts         # Tipos
│   │   ├── config.ts        # Configurações
│   │   └── server.ts        # Servidor
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

# 🛡️ Segurança

O projeto possui diversas medidas de segurança:

* HTTPS recomendado em produção
* Rate limiting
* Autenticação JWT
* Hash de senhas com bcrypt
* Headers de segurança com Helmet
* CORS configurável
* Validação de entradas
* Proteção contra SQL Injection
* Proteção contra XSS
* Cookies HTTP-only para sessões administrativas
* Vinculação de licença por HWID
* Controle de sessões
* Registro de eventos e atividades

---

# 🚀 Produção

Antes de colocar o sistema em produção:

* Utilize HTTPS.
* Gere um `JWT_SECRET` forte e aleatório.
* Nunca publique arquivos `.env`.
* Configure corretamente o CORS.
* Utilize credenciais diferentes das utilizadas no desenvolvimento.
* Configure limites de requisições.
* Faça backups periódicos do banco de dados.
* Revise as permissões administrativas.
* Monitore os logs da aplicação.

---

# 📄 Licença

Este projeto está disponível sob a licença **MIT**.

Consulte o arquivo `LICENSE` para obter os termos completos.

---

<div align="center">

## 🔐 KeyManager

**Sistema moderno para gerenciamento de licenças e aplicações.**

React · Node.js · TypeScript

</div>
