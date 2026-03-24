import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const BUDGET_PATH = path.join(ROOT, "config", "budget.json");
const USAGE_PATH = path.join(ROOT, "logs", "usage.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function monthKey(isoTs) {
  return isoTs.slice(0, 7);
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function monthTotal(entries, month) {
  return entries
    .filter((e) => monthKey(e.ts) === month)
    .reduce((acc, e) => acc + Number(e.usd || 0), 0);
}

function printStatus(entries, budget, month) {
  const spent = monthTotal(entries, month);
  const remaining = Number(budget.monthly_budget_usd) - spent;
  const pct = Number(budget.monthly_budget_usd) > 0 ? (spent / Number(budget.monthly_budget_usd)) * 100 : 0;

  console.log(`Mes: ${month}`);
  console.log(`Gasto: $${spent.toFixed(2)}`);
  console.log(`Teto: $${Number(budget.monthly_budget_usd).toFixed(2)}`);
  console.log(`Restante: $${remaining.toFixed(2)}`);
  console.log(`Uso: ${pct.toFixed(1)}%`);

  if (pct >= Number(budget.warning_threshold_percent)) {
    console.log("ALERTA: acima do limite de aviso.");
  }
  if (budget.hard_stop_enabled && spent >= Number(budget.monthly_budget_usd)) {
    console.log("BLOQUEIO: teto mensal atingido.");
    return 2;
  }
  return 0;
}

function parseFlag(name, fallback = undefined) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback;
  return process.argv[idx + 1];
}

function usageAndExit() {
  console.log("Uso:");
  console.log("  node starter/scripts/cost_guard.mjs status [--month YYYY-MM]");
  console.log("  node starter/scripts/cost_guard.mjs can-run [--estimate 0.15] [--month YYYY-MM]");
  console.log("  node starter/scripts/cost_guard.mjs add --usd 0.12 [--label \"analise\"] [--meta \"obs\"]");
  process.exit(1);
}

function main() {
  const cmd = process.argv[2];
  if (!cmd) usageAndExit();

  const budget = readJson(BUDGET_PATH);
  const usage = readJson(USAGE_PATH);
  const entries = Array.isArray(usage.entries) ? usage.entries : [];
  const month = parseFlag("--month", currentMonth());

  if (cmd === "status") {
    process.exit(printStatus(entries, budget, month));
  }

  if (cmd === "can-run") {
    const est = Number(parseFlag("--estimate", budget.default_estimated_call_usd));
    const spent = monthTotal(entries, month);
    const projected = spent + est;
    console.log(`Mes: ${month}`);
    console.log(`Atual: $${spent.toFixed(2)} | Estimativa chamada: $${est.toFixed(2)} | Projetado: $${projected.toFixed(2)}`);
    if (budget.hard_stop_enabled && projected > Number(budget.monthly_budget_usd)) {
      console.log("NAO PODE: ultrapassa o teto mensal.");
      process.exit(1);
    }
    console.log("PODE: dentro do teto.");
    process.exit(0);
  }

  if (cmd === "add") {
    const usdRaw = parseFlag("--usd");
    if (!usdRaw) {
      console.error("Erro: informe --usd.");
      usageAndExit();
    }
    const entry = {
      ts: nowIso(),
      usd: Number(usdRaw),
      label: parseFlag("--label", "api_call"),
      meta: parseFlag("--meta", ""),
    };
    entries.push(entry);
    writeJson(USAGE_PATH, { entries });
    console.log(`Registrado: $${entry.usd.toFixed(4)} | ${entry.label}`);
    process.exit(printStatus(entries, budget, month));
  }

  usageAndExit();
}

main();
