# Starter pessoal economico (M1 Plus + IA)

Plano para voce usar IA no desenvolvimento dos pontos com controle de custo mensal.

## Objetivo

- Rodar local no seu PC.
- Pagar apenas o uso de API.
- Controlar teto mensal automaticamente.

## Estrutura

- `config/budget.json`: teto e regras de custo.
- `logs/usage.json`: historico de custos.
- `scripts/cost_guard.py`: script para registrar e validar gastos.

## Setup inicial (1 minuto)

1. Ajuste o teto no arquivo `config/budget.json`.
2. No terminal:

```powershell
node "starter/scripts/cost_guard.mjs" status
```

## Uso diario recomendado

Antes de uma chamada com IA:

```powershell
node "starter/scripts/cost_guard.mjs" can-run --estimate 0.15
```

Depois da chamada (com custo real):

```powershell
node "starter/scripts/cost_guard.mjs" add --usd 0.12 --label "analise imagem ponto"
```

Ver resumo do mes:

```powershell
node "starter/scripts/cost_guard.mjs" status
```

## Meta de custo pessoal

Configuracao sugerida para comecar:

- teto mensal: `40.00` USD
- alerta: `80%`
- hard stop: `true`

## Proximo passo (tecnico)

Quando quiser, montamos a fase 2:

- endpoint local para enviar imagem + prompt tecnico,
- salvar resposta em JSON versionado,
- preencher automaticamente o `rows[]` da tela de simbolos.

## Base de conhecimento (densidade / calibre)

Servico local para cadastrar **fio**, **máquina/finura**, **tipo de ponto**, **amostras de densidade**
(carreiras e colunas por 10 cm) e calcular **agulhas + carreiras** por medida.

```powershell
cd "starter/knowledge-base"
npm install
npm start
```

Abra `http://localhost:3777`.

- Dados em `starter/knowledge-base/library.json` (fácil de versionar e fazer backup).
- Importação web **conservadora** (guarda excerto para revisão):

```powershell
cd "starter/knowledge-base"
node import-web.mjs --url "https://..." --label "ficha fornecedor"
```

> A extração automática de densidade a partir da internet é limitada por direitos de uso e
> qualidade das fontes; o fluxo seguro é: importar → você valida → cria amostra manualmente na UI.

## Opcional: versao Python

Existe tambem o script `scripts/cost_guard.py`, caso voce instale Python no futuro.
