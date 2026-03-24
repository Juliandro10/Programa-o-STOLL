import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB_PATH = path.join(__dirname, "library.json");
const PUBLIC = path.join(__dirname, "public");
/** Raiz do repo (Programa-o-STOLL) — para abrir stoll-vista-simbolos-m1plus.html a partir da UI local. */
const REPO_ROOT = path.join(__dirname, "..", "..");
const PORT = Number(process.env.PORT || 3777);

function readLibrary() {
  return JSON.parse(fs.readFileSync(LIB_PATH, "utf-8"));
}

function writeLibrary(lib) {
  fs.writeFileSync(LIB_PATH, `${JSON.stringify(lib, null, 2)}\n`, "utf-8");
}

const app = express();

/** Permite abrir index.html via file:// e falar com esta API (uso local). */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "2mb" }));
app.use("/repo", express.static(REPO_ROOT, { index: false, dotfiles: "ignore" }));
app.use(express.static(PUBLIC));

app.get("/api/library", (req, res) => {
  try {
    res.json(readLibrary());
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/api/yarns", (req, res) => {
  const b = req.body || {};
  const lib = readLibrary();
  const row = {
    id: b.id || crypto.randomUUID(),
    name: String(b.name || "").trim(),
    material: String(b.material || "").trim(),
    plies: b.plies == null || b.plies === "" ? null : Number(b.plies),
    tex: b.tex == null || b.tex === "" ? null : Number(b.tex),
    nm: b.nm == null || b.nm === "" ? null : Number(b.nm),
    notes: String(b.notes || "").trim(),
  };
  if (!row.name) return res.status(400).json({ error: "name obrigatorio" });
  lib.yarns = lib.yarns.filter((y) => y.id !== row.id);
  lib.yarns.push(row);
  writeLibrary(lib);
  res.json(row);
});

app.post("/api/machines", (req, res) => {
  const b = req.body || {};
  const lib = readLibrary();
  const row = {
    id: b.id || crypto.randomUUID(),
    name: String(b.name || "").trim(),
    gaugeE: b.gaugeE == null || b.gaugeE === "" ? null : Number(b.gaugeE),
    pitchMm: b.pitchMm == null || b.pitchMm === "" ? null : Number(b.pitchMm),
    brandModel: String(b.brandModel || "").trim(),
    notes: String(b.notes || "").trim(),
  };
  if (!row.name) return res.status(400).json({ error: "name obrigatorio" });
  lib.machines = lib.machines.filter((m) => m.id !== row.id);
  lib.machines.push(row);
  writeLibrary(lib);
  res.json(row);
});

app.post("/api/stitch-types", (req, res) => {
  const b = req.body || {};
  const lib = readLibrary();
  const row = {
    id: b.id || crypto.randomUUID(),
    code: String(b.code || "").trim(),
    name: String(b.name || "").trim(),
    notes: String(b.notes || "").trim(),
  };
  if (!row.code || !row.name) return res.status(400).json({ error: "code e name obrigatorios" });
  const codeLc = row.code.toLowerCase();
  lib.stitchTypes = lib.stitchTypes.filter(
    (s) => s.id !== row.id && String(s.code).toLowerCase() !== codeLc,
  );
  lib.stitchTypes.push(row);
  writeLibrary(lib);
  res.json(row);
});

app.post("/api/density-samples", (req, res) => {
  const b = req.body || {};
  const lib = readLibrary();
  const row = {
    id: b.id || crypto.randomUUID(),
    yarnId: String(b.yarnId || "").trim(),
    machineId: String(b.machineId || "").trim(),
    stitchTypeId: String(b.stitchTypeId || "").trim(),
    coursesPer10cm: Number(b.coursesPer10cm),
    walesPer10cm: Number(b.walesPer10cm),
    tension: String(b.tension || "").trim(),
    source: String(b.source || "manual"),
    sourceUrl: b.sourceUrl ? String(b.sourceUrl) : null,
    notes: String(b.notes || "").trim(),
    createdAt: new Date().toISOString(),
  };
  if (!row.yarnId || !row.machineId || !row.stitchTypeId) {
    return res.status(400).json({ error: "yarnId, machineId, stitchTypeId obrigatorios" });
  }
  if (!Number.isFinite(row.coursesPer10cm) || !Number.isFinite(row.walesPer10cm)) {
    return res.status(400).json({ error: "coursesPer10cm e walesPer10cm devem ser numeros" });
  }
  lib.densitySamples = lib.densitySamples.filter((d) => d.id !== row.id);
  lib.densitySamples.push(row);
  writeLibrary(lib);
  res.json(row);
});

app.post("/api/calc-size", (req, res) => {
  const b = req.body || {};
  const widthCm = Number(b.widthCm);
  const heightCm = Number(b.heightCm);
  const sampleId = String(b.sampleId || "");
  const lib = readLibrary();
  const s = lib.densitySamples.find((d) => d.id === sampleId);
  if (!s) return res.status(400).json({ error: "sampleId invalido" });
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm)) {
    return res.status(400).json({ error: "widthCm e heightCm obrigatorios" });
  }
  const needles = Math.round((widthCm / 10) * s.walesPer10cm);
  const courses = Math.round((heightCm / 10) * s.coursesPer10cm);
  res.json({
    sampleId: s.id,
    widthCm,
    heightCm,
    needles,
    courses,
    walesPer10cm: s.walesPer10cm,
    coursesPer10cm: s.coursesPer10cm,
  });
});

app.listen(PORT, () => {
  console.log(`knowledge-base: http://localhost:${PORT}`);
});
