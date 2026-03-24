import argparse
import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any


ROOT = Path(__file__).resolve().parent.parent
BUDGET_PATH = ROOT / "config" / "budget.json"
USAGE_PATH = ROOT / "logs" / "usage.json"


@dataclass
class Budget:
    monthly_budget_usd: float
    warning_threshold_percent: float
    hard_stop_enabled: bool
    default_estimated_call_usd: float


def read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Arquivo nao encontrado: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=True)
        f.write("\n")


def load_budget() -> Budget:
    data = read_json(BUDGET_PATH)
    return Budget(
        monthly_budget_usd=float(data["monthly_budget_usd"]),
        warning_threshold_percent=float(data["warning_threshold_percent"]),
        hard_stop_enabled=bool(data["hard_stop_enabled"]),
        default_estimated_call_usd=float(data["default_estimated_call_usd"]),
    )


def load_entries() -> List[Dict[str, Any]]:
    data = read_json(USAGE_PATH)
    return list(data.get("entries", []))


def save_entries(entries: List[Dict[str, Any]]) -> None:
    write_json(USAGE_PATH, {"entries": entries})


def month_key(iso_ts: str) -> str:
    dt = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
    return f"{dt.year:04d}-{dt.month:02d}"


def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def month_total(entries: List[Dict[str, Any]], month: str) -> float:
    return sum(float(e["usd"]) for e in entries if month_key(e["ts"]) == month)


def month_current() -> str:
    now = datetime.utcnow()
    return f"{now.year:04d}-{now.month:02d}"


def print_status(entries: List[Dict[str, Any]], budget: Budget, month: str) -> int:
    spent = month_total(entries, month)
    remaining = budget.monthly_budget_usd - spent
    pct = 0.0 if budget.monthly_budget_usd <= 0 else (spent / budget.monthly_budget_usd) * 100.0
    avg = 0.0 if not entries else sum(float(e["usd"]) for e in entries) / len(entries)

    print(f"Mes: {month}")
    print(f"Gasto: ${spent:.2f}")
    print(f"Teto: ${budget.monthly_budget_usd:.2f}")
    print(f"Restante: ${remaining:.2f}")
    print(f"Uso: {pct:.1f}%")
    if avg > 0:
        print(f"Custo medio por chamada (historico): ${avg:.3f}")
    if pct >= budget.warning_threshold_percent:
        print("ALERTA: acima do limite de aviso.")
    if budget.hard_stop_enabled and spent >= budget.monthly_budget_usd:
        print("BLOQUEIO: teto mensal atingido.")
        return 2
    return 0


def cmd_add(args: argparse.Namespace) -> int:
    entries = load_entries()
    entry = {
        "ts": now_iso(),
        "usd": round(float(args.usd), 6),
        "label": args.label or "api_call",
        "meta": args.meta or "",
    }
    entries.append(entry)
    save_entries(entries)
    print(f"Registrado: ${entry['usd']:.4f} | {entry['label']}")
    return cmd_status(args)


def cmd_status(args: argparse.Namespace) -> int:
    entries = load_entries()
    budget = load_budget()
    month = args.month or month_current()
    return print_status(entries, budget, month)


def cmd_can_run(args: argparse.Namespace) -> int:
    entries = load_entries()
    budget = load_budget()
    month = args.month or month_current()
    estimate = float(args.estimate or budget.default_estimated_call_usd)
    spent = month_total(entries, month)
    projected = spent + estimate

    print(f"Mes: {month}")
    print(f"Atual: ${spent:.2f} | Estimativa chamada: ${estimate:.2f} | Projetado: ${projected:.2f}")
    if budget.hard_stop_enabled and projected > budget.monthly_budget_usd:
        print("NAO PODE: ultrapassa o teto mensal.")
        return 1
    print("PODE: dentro do teto.")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Controle simples de custos de IA (uso pessoal).")
    sub = p.add_subparsers(dest="cmd", required=True)

    p_add = sub.add_parser("add", help="Registra um custo de chamada")
    p_add.add_argument("--usd", required=True, type=float, help="Valor em USD")
    p_add.add_argument("--label", default="api_call", help="Descricao curta")
    p_add.add_argument("--meta", default="", help="Info opcional")
    p_add.add_argument("--month", default=None, help="Mes YYYY-MM (opcional, status)")
    p_add.set_defaults(func=cmd_add)

    p_status = sub.add_parser("status", help="Mostra gasto do mes")
    p_status.add_argument("--month", default=None, help="Mes YYYY-MM")
    p_status.set_defaults(func=cmd_status)

    p_can = sub.add_parser("can-run", help="Valida se pode executar nova chamada")
    p_can.add_argument("--estimate", type=float, default=None, help="Estimativa em USD")
    p_can.add_argument("--month", default=None, help="Mes YYYY-MM")
    p_can.set_defaults(func=cmd_can_run)

    return p


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
