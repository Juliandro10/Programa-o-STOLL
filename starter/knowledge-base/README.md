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

## Import web

```powershell
node import-web.mjs --url "https://..." --label "descricao"
```

O texto é truncado e fica em `webImports` para você extrair números e criar uma **amostra** na UI.

## Cálculo

Com uma amostra selecionada:

- `agulhas ≈ round(larguraCm / 10 * walesPer10cm)`
- `carreiras ≈ round(alturaCm / 10 * coursesPer10cm)`

Ajuste fino (tensão, lavagem) fica nas notas da amostra.
