# Arquivo Morto — Controle de Estoque por QR Code

Aplicação web Fullstack para controlar materiais, caixas e documentos armazenados em arquivo morto ou depósito. O sistema permite cadastrar itens, gerar etiquetas com QR Code, registrar entradas e saídas pelo celular e consultar todo o histórico de movimentações.

O código de cada produto segue obrigatoriamente o padrão `FFF.TTT.PPPP`:

```text
001.001.0042
│   │   └── Produto 0042
│   └────── Tipo 001
└────────── Família 001
```

## Sumário

- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação rápida](#instalação-rápida)
- [Configuração detalhada](#configuração-detalhada)
- [Como utilizar](#como-utilizar)
- [PWA e uso no celular](#pwa-e-uso-no-celular)
- [Publicação no GitHub, Vercel e Cloudflare Pages](#publicação-no-github-vercel-e-cloudflare-pages)
- [Estrutura do projeto](#estrutura-do-projeto)
- [API REST](#api-rest)
- [Regras importantes](#regras-importantes)
- [Segurança](#segurança)
- [Solução de problemas](#solução-de-problemas)

## Funcionalidades

- Painel com totais de produtos, unidades armazenadas, entradas, saídas e alertas.
- Cadastro de famílias e tipos com códigos sequenciais de três dígitos.
- Cadastro de produtos com SKU automático no formato `FFF.TTT.PPPP`.
- Nome, descrição, localização, quantidade inicial e estoque mínimo.
- Geração e visualização de QR Code após o cadastro.
- Impressão de etiquetas em lote ou salvamento como PDF pelo navegador.
- Entrada e retirada por câmera, imagem com QR Code ou digitação manual do SKU.
- Validação de saldo antes de uma retirada.
- Histórico com responsável, motivo, quantidade, saldos, data e hora.
- Busca por SKU, nome, família, tipo, movimentação e período.
- Destaque visual para produtos zerados ou abaixo do estoque mínimo.
- Layout responsivo para computador e celular.
- PWA instalável na tela inicial do dispositivo.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, Tailwind CSS via CDN e JavaScript Vanilla |
| Backend | Node.js 22+ e Express.js |
| Banco de dados | Supabase PostgreSQL |
| Leitura de QR Code | `html5-qrcode` |
| Geração de QR Code | `qrcodejs` |
| PWA | Web App Manifest e Service Worker |

Não são utilizados React, Vue ou arquivos CSS personalizados.

## Pré-requisitos

Antes de começar, instale ou providencie:

- [Node.js](https://nodejs.org/) versão 22 ou superior;
- npm, incluído na instalação do Node.js;
- uma conta e um projeto no [Supabase](https://supabase.com/);
- Brave, Chrome, Edge ou outro navegador moderno.

Verifique a versão do Node.js:

```bash
node --version
```

## Instalação rápida

1. Configure o banco executando [`backend/database/schema.sql`](backend/database/schema.sql) no SQL Editor do Supabase.
2. Copie [`backend/.env.example`](backend/.env.example) para `backend/.env`.
3. Preencha a URL e a chave secreta do Supabase no `.env`.
4. Instale as dependências e inicie o sistema:

```bash
cd backend
npm install
npm start
```

5. Abra no navegador:

```text
http://localhost:3000
```

> O Express entrega a API e o frontend pelo mesmo endereço. Não use Live Server para abrir os arquivos HTML.

## Configuração detalhada

### 1. Criar e preparar o banco no Supabase

1. Crie um projeto no Supabase.
2. No painel do projeto, abra **SQL Editor**.
3. Crie uma nova consulta.
4. Copie todo o conteúdo de [`backend/database/schema.sql`](backend/database/schema.sql).
5. Execute o script e confirme que não houve erros.

O script cria:

- tabelas `familias`, `tipos`, `produtos` e `movimentacoes`;
- chaves estrangeiras, restrições e índices;
- geração sequencial e atômica dos códigos;
- movimentações atômicas, atualizando estoque e histórico na mesma transação;
- proteção contra retirada sem saldo;
- RLS e permissões restritas ao backend;
- uma família e um tipo de demonstração.

O script é idempotente nas principais estruturas e pode ser executado novamente para aplicar as definições presentes no arquivo.

### 2. Criar o arquivo `.env`

Entre na pasta do backend:

```bash
cd backend
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Edite `backend/.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_secreta_do_backend
PORT=3000
# BACKEND_API_TOKEN=necessario-apenas-na-vercel
```

Onde encontrar os valores:

- `SUPABASE_URL`: URL do projeto no painel do Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: prefira uma chave `sb_secret_...`; a chave legada `service_role` também funciona.
- `PORT`: porta local do Express; o padrão é `3000`.
- `BACKEND_API_TOKEN`: segredo compartilhado entre Cloudflare e Vercel em produção. Localmente pode ficar ausente.

Se o frontend for servido por outra origem durante desenvolvimento, é possível adicionar:

```env
FRONTEND_ORIGIN=http://localhost:5500,http://127.0.0.1:5500
```

Para o funcionamento normal deste projeto essa variável não é necessária, pois o próprio Express serve o frontend.

> Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend, em commits, capturas de tela ou repositórios públicos. Essa chave possui privilégios elevados e deve existir somente no backend.

### 3. Instalar e executar

```bash
cd backend
npm install
npm start
```

Com o arquivo `package-lock.json`, também é possível instalar exatamente as versões registradas:

```bash
npm ci
```

Comandos disponíveis:

| Comando | Finalidade |
|---|---|
| `npm start` | Inicia o servidor em modo normal |
| `npm run dev` | Inicia com reinício automático pelo Nodemon |
| `npm run check` | Verifica a sintaxe dos arquivos principais do backend |

O GitHub Actions executa automaticamente a instalação, as verificações de sintaxe e os testes do pacote de deploy em cada push ou pull request para a branch `main`.

Teste rápido do servidor:

```text
GET http://localhost:3000/api/health
```

Resposta esperada:

```json
{"status":"ok"}
```

## Como utilizar

### Primeiro cadastro

1. Abra **Famílias e Tipos**.
2. Cadastre uma família, como `Documentos`.
3. Cadastre um tipo dentro dela, como `Caixas de Arquivo`.
4. Abra **Produtos** e selecione a família e o tipo.
5. Informe nome, descrição, localização, quantidade inicial e estoque mínimo.
6. Salve o produto. O SKU e o QR Code serão gerados automaticamente.
7. Abra **Etiquetas**, selecione o produto e use **Imprimir selecionadas**.

### Registrar entrada

1. No celular, abra **Scanner**.
2. Permita o acesso à câmera.
3. Leia o QR Code do produto.
4. Selecione **Entrada**.
5. Informe a quantidade e o responsável.
6. Confirme a movimentação.

### Registrar saída

1. Leia o QR Code ou digite o SKU manualmente.
2. Selecione **Saída**.
3. Informe a quantidade, o motivo e o responsável.
4. Confirme a retirada.

O sistema rejeita automaticamente retiradas maiores que o saldo disponível.

### Consultar histórico

Abra **Histórico** para pesquisar por:

- SKU;
- nome do produto;
- família e tipo;
- entrada ou saída;
- período inicial e final.

## PWA e uso no celular

O projeto possui manifesto, ícones e Service Worker. Em um endereço permitido, o Brave pode exibir a opção **Instalar Arquivo Morto** ou **Adicionar à tela inicial**.

O PWA e a câmera exigem um contexto seguro:

- `http://localhost:3000` é aceito durante o desenvolvimento no próprio computador;
- uma publicação real deve utilizar HTTPS;
- acessar pelo celular usando apenas `http://192.168.x.x:3000` pode bloquear a câmera e a instalação do PWA.

Para testar em um celular real, publique a aplicação com HTTPS ou utilize um túnel HTTPS apontando para a porta `3000`.

O Service Worker mantém o shell local da aplicação. Entretanto:

- consultas, cadastros e movimentações precisam de internet para acessar o Supabase;
- o Tailwind CSS é carregado por CDN, portanto o visual completo não é garantido quando o dispositivo está totalmente offline;
- as bibliotecas de leitura e geração de QR Code são entregues localmente pelo backend.

Se a câmera não estiver disponível, o scanner também permite enviar uma imagem com QR Code ou digitar o SKU manualmente.

## Publicação no GitHub, Vercel e Cloudflare Pages

Em produção, os serviços ficam organizados assim:

```text
Usuário autenticado
       │
       ▼
Cloudflare Pages + Pages Functions
       │  token privado entre servidores
       ▼
Vercel + Express
       │  chave secreta do Supabase
       ▼
Supabase PostgreSQL
```

O navegador continua chamando `/api`. A Pages Function encaminha essas chamadas para a Vercel, adicionando um token que nunca é enviado ao JavaScript público.

### 1. Gerar os segredos

Gere valores diferentes para a senha de acesso e para o token interno. Um token pode ser gerado com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Não salve esses valores em arquivos versionados.

### 2. Enviar para o GitHub

Na raiz do projeto:

```bash
git init
git branch -M main
git add .
git status
git commit -m "Preparar sistema de estoque para deploy"
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

Antes do commit, confirme que `backend/.env`, `node_modules` e `frontend/vendor` não aparecem no `git status`.

### 3. Publicar o backend na Vercel

1. Importe o repositório do GitHub na Vercel.
2. Em **Root Directory**, selecione `backend`.
3. Mantenha o framework como **Other**.
4. Cadastre estas variáveis para Production e Preview:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_sua_chave
BACKEND_API_TOKEN=token-interno-gerado-anteriormente
```

5. Faça o deploy.
6. Teste `https://SEU-BACKEND.vercel.app/api/health`.

Resposta esperada:

```json
{"status":"ok"}
```

As demais rotas da Vercel respondem `401` quando chamadas sem o token do proxy. Isso é intencional.

### 4. Publicar o frontend no Cloudflare Pages

Importe o mesmo repositório e use:

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Root directory | deixe vazio, usando a raiz do repositório |
| Framework preset | `None` |
| Build command | `npm ci --prefix backend && node scripts/prepare-frontend.js` |
| Build output directory | `frontend` |

Cadastre estas variáveis em **Settings → Variables and Secrets**, tanto para Production quanto para Preview:

```env
BACKEND_API_URL=https://SEU-BACKEND.vercel.app
BACKEND_API_TOKEN=mesmo-token-configurado-na-vercel
APP_USERNAME=usuario-do-sistema
APP_PASSWORD=senha-forte-do-sistema
```

Use letras ASCII no usuário e na senha compartilhada. Marque `BACKEND_API_TOKEN` e `APP_PASSWORD` como segredos criptografados.

Depois do deploy:

1. abra o endereço `*.pages.dev`;
2. informe `APP_USERNAME` e `APP_PASSWORD` quando o navegador solicitar;
3. confirme que o painel carrega os dados;
4. teste uma entrada e uma saída;
5. instale o PWA pelo menu do navegador;
6. teste o QR Code e a câmera em HTTPS.

Antes de publicar, a preparação local pode ser conferida com:

```bash
npm ci --prefix backend
node scripts/prepare-frontend.js
node scripts/check-deploy.js
npm run check --prefix backend
```

Para trocar o domínio da Vercel, atualize somente `BACKEND_API_URL` no Cloudflare. Para trocar o token interno, altere `BACKEND_API_TOKEN` nos dois serviços no mesmo momento.

### Proteção implementada

- O Cloudflare solicita usuário e senha antes de entregar o site.
- A Pages Function encaminha apenas os cabeçalhos necessários.
- O token interno é substituído pelo proxy e não pode ser escolhido pelo navegador.
- A Vercel recusa acesso às rotas de dados sem o token correto.
- A chave secreta do Supabase existe somente na Vercel.

Essa autenticação compartilhada é adequada para uma demonstração acadêmica ou uma equipe pequena. Para usuários individuais, recuperação de senha e permissões diferentes, substitua-a futuramente por Supabase Auth.

## Estrutura do projeto

```text
Sistema-de-Controle-de-Estoque-main/
├── backend/
│   ├── database/
│   │   └── schema.sql              Estrutura e regras do PostgreSQL
│   ├── src/
│   │   ├── config/supabase.js      Cliente Supabase exclusivo do backend
│   │   ├── routes/                 Rotas REST
│   │   ├── utils/                  Validações e respostas auxiliares
│   │   └── server.js               Inicialização do Express
│   ├── .env.example                Modelo das variáveis de ambiente
│   ├── package.json
│   ├── package-lock.json
│   └── vercel.json                Roteamento Serverless da Vercel
├── functions/
│   ├── _middleware.js             Autenticação do Cloudflare Pages
│   └── api/[[path]].js            Proxy seguro para a Vercel
├── frontend/
│   ├── icons/                      Ícones do PWA
│   ├── js/                         JavaScript das páginas
│   ├── index.html                  Painel principal
│   ├── produtos.html               Produtos e QR Codes
│   ├── familias-tipos.html         Famílias e tipos
│   ├── scanner.html                Entrada e saída
│   ├── historico.html              Histórico e filtros
│   ├── etiquetas.html              Impressão de etiquetas
│   ├── manifest.json               Manifesto do PWA
│   ├── sw.js                       Service Worker
│   ├── _headers                    Cabeçalhos de segurança do Cloudflare
│   └── _routes.json                Rotas das Pages Functions
├── scripts/
│   ├── prepare-frontend.js         Prepara as bibliotecas QR para o deploy
│   └── check-deploy.js             Valida proxy, autenticação e artefatos
├── PROPOSTA.md                     Requisitos originais do trabalho
├── README.md                       Documentação do projeto
```

## API REST

Todas as rotas começam com `/api`.

| Método | Endpoint | Finalidade |
|---|---|---|
| `GET` | `/api/health` | Verificar se o servidor está ativo |
| `GET` | `/api/familias` | Listar famílias |
| `POST` | `/api/familias` | Criar família com código automático |
| `PUT` | `/api/familias/:id` | Editar família |
| `DELETE` | `/api/familias/:id` | Excluir família sem vínculos |
| `GET` | `/api/tipos` | Listar tipos, opcionalmente por família |
| `POST` | `/api/tipos` | Criar tipo com código automático |
| `PUT` | `/api/tipos/:id` | Editar tipo |
| `DELETE` | `/api/tipos/:id` | Excluir tipo sem vínculos |
| `GET` | `/api/produtos` | Listar e filtrar produtos |
| `GET` | `/api/produtos/proximo-codigo` | Consultar a prévia do próximo SKU |
| `GET` | `/api/produtos/codigo/:codigo` | Consultar produto pelo SKU |
| `POST` | `/api/produtos` | Cadastrar produto |
| `PUT` | `/api/produtos/:id` | Editar dados cadastrais do produto |
| `DELETE` | `/api/produtos/:id` | Excluir produto sem movimentações |
| `GET` | `/api/movimentacoes` | Consultar histórico e filtros |
| `POST` | `/api/movimentacoes/entrada` | Registrar entrada |
| `POST` | `/api/movimentacoes/saida` | Registrar saída |

## Regras importantes

- Família utiliza código `FFF`, de `001` a `999`.
- Tipo utiliza código `TTT`, de `001` a `999`, dentro de cada família.
- Produto utiliza código `PPPP`, de `0001` a `9999`, dentro de cada combinação família/tipo.
- Depois da criação, família, tipo e SKU do produto não são alterados.
- A quantidade do produto só deve mudar por entrada ou saída.
- Quantidades devem ser números inteiros não negativos.
- Movimentações devem possuir quantidade maior que zero e responsável.
- Saída exige motivo e saldo suficiente.
- Produtos com histórico não podem ser excluídos.
- Famílias e tipos vinculados a outros registros também não podem ser excluídos.
- O histórico retorna no máximo as 1.000 movimentações mais recentes por consulta.

## Segurança

- O navegador não acessa o Supabase diretamente.
- Localmente, a chave secreta fica somente em `backend/.env`; na produção, fica nas variáveis protegidas da Vercel.
- `backend/.env` está ignorado pelo Git.
- Em produção, o navegador também não recebe o token interno entre Cloudflare e Vercel.
- O Cloudflare Pages exige usuário e senha antes de servir o sistema.
- A API da Vercel compara o token usando uma operação resistente a diferenças de tempo.
- As tabelas possuem RLS habilitado e o acesso público de `anon` e `authenticated` é revogado pelo script SQL.
- A API valida códigos, textos e quantidades antes de consultar o banco.
- Textos exibidos dinamicamente são escapados para reduzir riscos de XSS armazenado.
- Estoque e histórico são atualizados atomicamente no PostgreSQL.

Esta é uma aplicação acadêmica sem login ou perfis de acesso, pois autenticação não faz parte da proposta original. Antes de disponibilizá-la como sistema público de produção, implemente autenticação, autorização por função, limitação de requisições, auditoria adicional e política de backup.

## Solução de problemas

### O sistema não inicia

Confirme a versão do Node.js, a existência de `backend/.env` e os valores de `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

```bash
cd backend
npm install
npm start
```

### A página abre, mas não carrega dados

- Confirme que o terminal mostra o servidor na porta correta.
- Abra `http://localhost:3000/api/health`.
- Verifique se o `schema.sql` foi executado no projeto correto.
- Não abra o HTML diretamente e não use Live Server.

### Não foi possível carregar a biblioteca de QR Code

1. Reinicie o backend.
2. Abra o sistema por `http://localhost:3000`.
3. No Brave, pressione `Ctrl + Shift + R` ou `Ctrl + F5`.
4. Se continuar, abra `brave://settings/content/all`, procure por `localhost` e remova os dados armazenados.
5. Abra novamente o sistema para instalar a versão atual do Service Worker.

### A câmera não abre

- Permita a câmera nas configurações do navegador.
- Use HTTPS ou `localhost`.
- No celular, evite acessar por um IP local usando HTTP.
- Confirme que nenhuma outra guia ou aplicativo está usando a câmera.
- Como alternativa, envie uma foto do QR Code ou digite o SKU.

### Um produto não pode ser excluído

Produtos com entradas ou saídas registradas são preservados para não quebrar o histórico. Essa é uma regra de integridade do banco, não um erro do QR Code.

### Alterações antigas continuam aparecendo

Reinicie o servidor e faça um recarregamento forçado. No Brave, use `Ctrl + Shift + R` ou `Ctrl + F5`. Se necessário, remova os dados de `localhost` nas configurações de privacidade do navegador.

### O Cloudflare mostra erro 503

Confira se `BACKEND_API_URL`, `BACKEND_API_TOKEN`, `APP_USERNAME` e `APP_PASSWORD` foram cadastrados no ambiente correto do Cloudflare Pages. Faça um novo deploy após alterar as variáveis.

### A API retorna 401 na Vercel

Esse retorno é esperado em chamadas diretas. Se ocorrer pelo site, confirme que `BACKEND_API_TOKEN` possui exatamente o mesmo valor na Vercel e no Cloudflare.

### O build do Cloudflare não encontra as bibliotecas QR

Use a raiz do repositório como Root Directory e o comando completo:

```bash
npm ci --prefix backend && node scripts/prepare-frontend.js
```

## Bônus implementados

- Impressão de etiquetas e salvamento como PDF pelo navegador.
- Alertas de estoque baixo ou zerado.
- PWA instalável na tela inicial.

## Licença e uso acadêmico

Projeto desenvolvido para fins acadêmicos com base nos requisitos descritos em [`PROPOSTA.md`](PROPOSTA.md).
