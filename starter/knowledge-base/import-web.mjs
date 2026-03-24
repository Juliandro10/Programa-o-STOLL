/**
 * Importação conservadora de URL: guarda texto bruto para revisão manual.
 * Uso: node import-web.mjs --url "https://..." --label "ficha fio X"
 *
 * Não faz scraping agressivo nem extrai densidades automaticamente.
 * Leis de uso / robots: respeite o site; prefira PDFs públicos ou fichas que você tenha direito de usar.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "library.json");

function parseArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function validateHttpUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: "URL invalida (formato)." };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "Só sao aceites http: ou https:." };
  }
  const host = (u.hostname || "").toLowerCase();
  if (!host || host === "..." || host.endsWith("...") || host.includes("..")) {
    return {
      ok: false,
      reason:
        "Hostname invalido ou placeholder (copiou o exemplo literal https://...). Use um link real, ex.: https://en.wikipedia.org/wiki/Yarn_count",
    };
  }
  return { ok: true, url: u.href };
}

async function main() {
  const urlRaw = parseArg("--url");
  const label = parseArg("--label") || "import_web";
  const maxChars = Number(parseArg("--max") || "80000");
  if (!urlRaw) {
    console.error('Uso: node import-web.mjs --url "https://site.com/pagina" [--label nome] [--max 80000]');
    console.error('Exemplo real: node import-web.mjs --url "https://en.wikipedia.org/wiki/Yarn_count" --label teste');
    process.exit(1);
  }

  const check = validateHttpUrl(urlRaw);
  if (!check.ok) {
    console.error(`Erro: ${check.reason}`);
    process.exit(1);
  }
  const url = check.url;

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
  const c = e && e.cause;
  if (c && c.code === "ENOTFOUND") {
    console.error(
      "Erro DNS (ENOTFOUND): o endereco nao existe ou o PC nao conseguiu resolver o nome.\n" +
        "- Confirme que copiou o URL completo (https://...)\n" +
        "- Teste no browser; se nao abrir, o link esta errado\n" +
        "- Verifique internet / VPN / DNS",
    );
    console.error(String(c && c.hostname ? `Hostname: ${c.hostname}` : ""));
  } else {
    console.error(e);
  }
  process.exit(1);
});
