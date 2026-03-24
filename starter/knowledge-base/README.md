# Base de conhecimento local (M1+ / densidade)

Arquivo único `library.json` com:

- **yarns** — fio, material, cabos, Tex/Nm
- **machines** — calibre (E), passo mm, modelo
- **stitchTypes** — código + nome do ponto
- **densitySamples** — carreiras/10 cm e colunas/10 cm (da prova ou nota validada)
- **webImports** — excertos de URL para revisão manual
- **references** — links de apoio (editáveis)

## Arranque

```powershell
npm install
npm start
```

Interface: `http://localhost:3777`

**Importante:** não abra `public/index.html` com duplo clique no Explorador (`file://`). Sem o servidor Node, nada grava em `library.json`. Sempre `npm start` e use o endereço acima.

Se abrir o HTML em ficheiro por engano, a página tenta falar com `http://127.0.0.1:3777` — o servidor tem de estar a correr.

## Ligação à calculadora → mockup de símbolos

Com `npm start`, o servidor expõe também a raiz do repositório em **`/repo`**.  
Depois de calcular agulhas e carreiras, use **Abrir mockup de símbolos** na UI (ou copie o link).

O ficheiro `stoll-vista-simbolos-m1plus.html` abre com grelha de composição nas dimensões calculadas (máx. 500×500 por desempenho).

Parâmetros úteis na URL do mockup:

- `composeCols` — largura em agulhas  
- `composeRows` — altura em carreiras  
- `composeStartNeedle` — primeira agulha na régua (ex.: 150)

## Import web

```powershell
node import-web.mjs --url "https://en.wikipedia.org/wiki/Yarn_count" --label "exemplo"
```

O texto é truncado e fica em `webImports` para você extrair números e criar uma **amostra** na UI.

## Cálculo

Com uma amostra selecionada:

- `agulhas ≈ round(larguraCm / 10 * walesPer10cm)`
- `carreiras ≈ round(alturaCm / 10 * coursesPer10cm)`

Ajuste fino (tensão, lavagem) fica nas notas da amostra.
