# Class Forge Beta

Aplicacao web educacional no estilo RPG, totalmente client-side, preparada para rodar no GitHub Pages.

## Estrutura do projeto

- `index.html`: markup da interface e importacao de dependencias externas.
- `styles.css`: estilos visuais, layout responsivo e animacoes.
- `app.js`: logica da aplicacao (estado, regras de batalha, integracao com IA, PDF e HUD).

## Como funciona

### 1) Configuracao inicial

Na tela inicial, voce escolhe:

- Materia (ou Modo Livre com texto/PDF).
- Dificuldade (3, 5, 7 fases; 10 fases em modo Omega).
- API Key da Gemini (opcional no modo demo, obrigatoria no modo IA).

### 2) Geracao das fases

- Modo IA: a aplicacao monta um prompt estruturado e chama a API Gemini.
- Modo Demo: carrega fases locais para testes sem internet/chave.

A aplicacao normaliza os dados recebidos para garantir:

- Quantidade minima de fases.
- Boss final na ultima fase.
- Estrutura consistente para quiz, magia e furtivo.

### 3) Loop de gameplay

- O mapa horizontal mostra cards de fases.
- Cada fase (exceto boss) permite escolher tipo de combate:
  - Quiz (multipla escolha)
  - Magia (verdadeiro/falso)
  - Furtivo (resposta aberta por palavras-chave)
- Erro reduz HP; acerto vence a fase.
- Ao completar todas as fases, exibe celebracao e mensagem de vitoria.

### 4) Sistema de dicas (vouchers)

A quantidade de dicas depende da dificuldade:

- 3 fases: 1 voucher
- 5 fases: 2 vouchers
- 7 fases: 3 vouchers
- 10 fases (Omega): 0 vouchers

### 5) Relatorios em PDF

No painel de controle, e possivel gerar:

- Prova para aluno
- Gabarito para professor

Usa a biblioteca `jsPDF` no navegador.

## Padrões e boas praticas aplicados

- Separacao de responsabilidades:
  - Estrutura (HTML), estilo (CSS), comportamento (JS).
- Module Pattern em `app.js`:
  - Encapsula estado e funcoes internas.
  - Expõe apenas o bootstrap (`init`).
- Estado centralizado:
  - HP, dados da aventura, fase atual, vouchers e flags de execucao.
- Event binding sem `onclick` inline:
  - Menor acoplamento entre HTML e JS.
- Guard clauses e validacoes de entrada:
  - Falhas de API e dados invalidos possuem fallback para demo.
- Compatibilidade e acessibilidade basica:
  - Layout responsivo para mobile e desktop.
  - Controle de scroll horizontal no mapa para desktop.

## Rodar localmente

Como o projeto e estatico, voce pode usar qualquer servidor HTTP local.

### Opcao A: Python

```bash
python -m http.server 5500
```

Acesse: http://localhost:5500

### Opcao B: Node (serve)

```bash
npx serve .
```

Acesse a URL exibida no terminal.

## Publicacao no GitHub Pages

1. Envie os arquivos para um repositorio no GitHub.
2. Em Settings > Pages, selecione a branch de publicacao (ex.: `main`) e a pasta raiz (`/root`).
3. Aguarde o deploy e abra a URL `https://<usuario>.github.io/<repositorio>/`.

## Dependencias externas carregadas via CDN

- Google Fonts (Cinzel e Roboto)
- PDF.js
- jsPDF

## Observacoes

- A API key da Gemini e usada apenas no cliente.
- Em ambiente publico, considere proteger chamadas de IA via backend para maior seguranca.
