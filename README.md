# Class Forge Beta 🎮

RPG educacional baseado em IA que gera automaticamente jogos com 3 tipos de combate: Quiz, Magia e Furtivo.

| | |
|---|---|
| **Versão** | 1.9 (Oracle) |
| **Arquitetura** | Frontend estático GitHub Pages |
| **Deploy** | GitHub Pages + GitHub Actions |

---

## ⚡ Início Rápido

### 1. Configurar GitHub Pages

Em seu repositório GitHub:

1. **Copie a chave Gemini**
   - Acesse https://aistudio.google.com/app/apikeys
   - Crie ou copie uma chave API

2. **Adicione como Secret**
   - Vá para Settings → Secrets and variables → Actions
   - Clique em "New repository secret"
   - Nome: `GEMINI_API_KEY`
   - Valor: sua chave

3. **Ative GitHub Pages**
   - Vá para Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main`, Folder: `/ (root)`

### 2. Deploy Automático

Todo push para `main` dispara o workflow que:
- Injeta a chave no arquivo `config.js`
- Faz deploy no GitHub Pages

```bash
git add .
git commit -m "Deploy v1.9"
git push origin main
```

A aplicação estará disponível em:
```
https://seu-usuario.github.io/classforgebeta/
```

### 3. Testar Localmente

```bash
# Terminal 1 - Servidor frontend
python -m http.server 5500

# Terminal 2 - Abrir no navegador
# http://localhost:5500?apiKey=SUA_CHAVE_AQUI
```

---

## 🎯 Como Funciona

1. Selecione um tema (Matemática, Física, etc.)
2. Digite conteúdo ou envie um PDF
3. Clique "GERAR JOGO (IA)"
4. A API Gemini gera 3-10 fases com desafios personalizados
5. Complete as fases com Quiz, Magia ou Furtivo

---

## 📁 Estrutura

```
classforgebeta/
├── index.html           # Frontend
├── app.js              # Lógica + chamada Gemini
├── styles.css          # Estilos responsivos
├── config.js           # Configuração (chave injetada)
├── build-local.cmd     # Desenvolvimento local
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions workflow
└── README.md           # Este arquivo
```

---

## 🔧 Configuração

### Em Produção (GitHub Pages)

A chave é injetada via GitHub Actions:
```javascript
// config.js (após build)
GEMINI_API_KEY: "sua-chave-aqui"  // Substituída pelo workflow
```

### Em Desenvolvimento (Local)

**Opção 1: Via Query Parameter**
```
http://localhost:5500?apiKey=SUA_CHAVE_AQUI
```

**Opção 2: Via localStorage**
```javascript
localStorage.setItem("GEMINI_API_KEY", "sua-chave-aqui");
```

---

## ⚙️ GitHub Actions Workflow

O arquivo `.github/workflows/deploy.yml` automatiza:

```yaml
1. Injetar secret GEMINI_API_KEY em config.js
2. Fazer deploy no GitHub Pages
3. Ativar em cada push para main
```

---

## 🔐 Segurança

- Chave Gemini armazenada como **GitHub Secret** (não em git)
- Injetada apenas no build (não é commitada)
- Frontend é estático (zero backend necessário)
- Sem exposição de credenciais

---

## 🛠️ Desenvolvimento Local

### Iniciar Tudo (Windows)

```bash
.\build-local.cmd
```

Faz automaticamente:
- Inicia servidor frontend (porta 5500)
- Abre navegador

### Manualmente

```bash
# Terminal único
python -m http.server 5500

# Navegador
# http://localhost:5500?apiKey=SUA_CHAVE_AQUI
```

---

## 📦 Dependências

**Frontend:** Nenhuma (Vanilla JS)
**Deployment:** GitHub Pages + GitHub Actions

---

## 🎮 Modo Demo

Clique "MODO DEMO" para testar sem IA usando dados mock.

---

## 📝 Changelog

**v1.9 Oracle (21/04/2026)**
- ✅ Frontend estático GitHub Pages
- ✅ Chave Gemini via GitHub Actions
- ✅ Chamada direta à API Gemini
- ✅ Responsivo mobile
- ✅ 3 tipos de combate

---

## 🚀 Troubleshooting

**"Chave Gemini não configurada"**
- Local: Use `?apiKey=SUA_CHAVE` ou localStorage
- GitHub Pages: Verifique Settings → Secrets

**"API Gemini retorna erro"**
- Validar chave em https://aistudio.google.com/app/apikeys
- Testar com curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=SUA_CHAVE"`

**"Workflow não dispara"**
- Verificar `.github/workflows/deploy.yml` no main branch
- Ir em Actions e ver logs

---

## 📧 Contato

Issues? Abra um GitHub Issue no repositório.

### Frontend no GitHub Pages

1. Faça push de todos os arquivos (exceto `backend/`) para seu repositório
2. Em **Settings > Pages**, selecione a branch (ex: `main`) e pasta raiz (`/root`)
3. A URL será: `https://usuario.github.io/classforgebeta/`

### Backend no Vercel (Recomendado)

1. Conecte seu repositório no Vercel
2. Configure o root directory como `backend`
3. Adicione variáveis de ambiente:
   - `GEMINI_API_KEY`: sua chave da Google
   - `NODE_ENV`: production
4. Deploy automático

### Backend no Railway

1. Conecte seu repositório no Railway
2. Crie um novo projeto
3. Configure as variáveis de ambiente
4. Deploy

### Backend em outros serviços

- **Render.com**: Suporta .env nativo
- **Heroku**: Use `Procfile` (não incluído, configurar manualmente)
- **Local/VPS**: Use `node backend/server.js` com `.env`

---

## Estrutura do Projeto

```
classforgebeta/
├── index.html              # Interface HTML
├── styles.css              # Estilos (responsivo)
├── app.js                  # Lógica do jogo (cliente)
├── README.md               # Este arquivo
├── requirements.txt        # Apenas referência histórica
│
└── backend/
    ├── server.js           # Servidor Express
    ├── package.json        # Dependências Node.js
    ├── .env.example        # Template de variáveis
    ├── .env                # Variáveis (não fazer upload!)
    ├── .gitignore          # Arquivos ignorados
    └── README.md           # Documentação backend
```

---

## Funcionalidades

### Modos de Jogo

- **GERAR JOGO (IA)**: Cria fases usando Gemini com tema ou PDF
- **MODO DEMO**: Carrega fases locais para testes sem backend
- **3 TIPOS DE COMBATE**:
  - **⚔️ Quiz**: Múltipla escolha com 4 opções
  - **✨ Magia**: Verdadeiro ou Falso com pegadinhas
  - **🧩 Furtivo**: Resposta aberta com palavras-chave

### Dificuldades

- **Rápido**: 3 fases (1 voucher)
- **Normal**: 5 fases (2 vouchers)
- **Longo**: 7 fases (3 vouchers)
- **ÔMEGA** (desbloqueável): 10 fases, modo ENEM/Vestibular (sem vouchers)

### Sistema de Vouchers (Dicas)

- Cada fase permite usar uma dica
- Quantidade depende da dificuldade
- Modo ÔMEGA: sem dicas disponíveis

### Controles Ocultos

- **Pressione r-u-g-a-l** para desbloquear o Modo ÔMEGA
- Apareça o novo nível com desafios de vestibular

---

## Contrato de Dados (API Backend)

### Requisição (POST /api/generate-adventure)

```json
{
  "subject": "Matemática",
  "content": "Conteúdo do PDF ou texto...",
  "totalStages": 5,
  "mode": "normal"
}
```

### Resposta (Sucesso)

```json
{
  "success": true,
  "adventure": [
    {
      "title": "Nome do Inimigo",
      "type": "enemy",
      "desc": "Lore do inimigo",
      "quiz": {
        "question": "Pergunta?",
        "options": ["A", "B", "C", "D"],
        "correct": 0,
        "hint": "Dica"
      },
      "magic": {
        "statement": "Verdadeiro ou falso?",
        "is_true": true,
        "hint": "Dica"
      },
      "stealth": {
        "question": "Defina...",
        "answer": "Resposta esperada",
        "keywords": ["palavra1", "palavra2"],
        "hint": "Dica"
      }
    }
  ],
  "stageCount": 5
}
```

---

## Segurança

### ✅ Boas Práticas Implementadas

- Chave da API **não fica exposta** no cliente
- Variáveis de ambiente no backend com `.env`
- CORS configurado para aceitar requisições do frontend
- Validação de entrada no servidor
- Tratamento seguro de erros
- `.gitignore` protege variáveis sensíveis

### 🔐 Configuração do .gitignore

Certifique-se de que `.env` está em `.gitignore`:

```
backend/.gitignore contém: .env
```

---

## Desenvolvimento Local

### Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express, CORS
- **IA**: Google Gemini API
- **Deploy**: GitHub Pages (frontend) + Vercel/Railway (backend)

### Estrutura do Frontend (app.js)

```javascript
const App = (() => {
  // Estado centralizado
  // Lógica de entrada (PDF, texto, tema)
  // Integração com backend
  // Renderização do mapa e batalhas
  // Sistema de audio e confete
  // Modo demo como fallback
})();
```

### Fluxo de Geração

1. Usuário preenche: tema, texto/PDF, dificuldade
2. Frontend manda para `POST /api/generate-adventure`
3. Backend monta prompt, chama Gemini
4. Resposta é normalizada e validada
5. Jogo renderiza o mapa com as fases

---

## Troubleshooting

### "Erro ao conectar com o backend"

1. Verifique se o backend está rodando
2. Confira a URL em `app.js` → `AI_BACKEND_URL`
3. Verifique CORS no servidor

### "Falha ao gerar fases"

1. Cheque se `GEMINI_API_KEY` está configurada
2. Verifique se a chave é válida em: https://aistudio.google.com/app/apikeys
3. Tente o Modo Demo como fallback

### "PDF não está sendo lido"

1. Máximo 5 páginas são processadas
2. Use arquivo PDF com texto selecionável (não imagem)
3. Tente copiar o texto manualmente

---

## Contribuições e Melhorias

Ideias de futuras versões:

- [ ] Integração com outras IA (OpenAI, Hugging Face)
- [ ] Relatórios detalhados de desempenho
- [ ] Multiplayer cooperativo
- [ ] Customização de avatares
- [ ] Sistema de ranque global
- [ ] Suporte a mais temas educacionais
- [ ] Tradução multilíngue

---

## Licença

MIT © 2024 Class Forge Team

---

## Contato

Para dúvidas, sugestões ou bugs, abra uma issue no repositório.
