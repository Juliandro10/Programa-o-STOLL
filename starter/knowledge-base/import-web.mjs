/**
 * Importação conservadora de URL: guarda texto bruto para revisão manual.
 * Uso: node import-web.mjs --url "https://..." --label "ficha fio X"
 *
 * Não faz scraping agressivo nem extrai densidades automaticamente.
 * Leis de uso / robots: respeite o site; prefira PDFs públicos ou fichas que você tenha direito de usar.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "library.json");

function parseArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

async function main() {
  const url = parseArg("--url");
  const label = parseArg("--label") || "import_web";
  const maxChars = Number(parseArg("--max") || "80000");
  if (!url) {
    console.error("Uso: node import-web.mjs --url \"https://...\" [--label nome] [--max 80000]");
    process.exit(1);
  }

  const res = await fetch(url, {
    headers: {
      "user-agent": "M1PlusKnowledgeBase/0.1 (personal research; contact: local)",
      accept: "text/html,text/plain,application/pdf,*/*",
    },
  });

  const contentType = res.headers.get("content-type") || "";
  let bodyText;
  if (contentType.includes("application/pdf")) {
    bodyText = `[PDF binário omitido — guarde o ficheiro manualmente ou use extrator local]\nURL: ${url}`;
  } else {
    const buf = Buffer.from(await res.arrayBuffer());
    bodyText = buf.toString("utf-8").slice(0, maxChars);
  }

  const lib = JSON.parse(fs.readFileSync(LIB, "utf-8"));
  lib.webImports = lib.webImports || [];
  lib.webImports.push({
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    url,
    label,
    statusCode: res.status,
    contentType,
    excerpt: bodyText.slice(0, 12000),
  });
  fs.writeFileSync(LIB, `${JSON.stringify(lib, null, 2)}\n`, "utf-8");
  console.log(`Import guardado em library.json (webImports). Rotulo: ${label}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
