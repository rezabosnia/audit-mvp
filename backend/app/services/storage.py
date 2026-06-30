import json
import math
from pathlib import Path
from typing import Any, Dict, Optional

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "processed"


class _NanSafeEncoder(json.JSONEncoder):
    def default(self, obj: Any) -> Any:
        if isinstance(obj, float) and math.isnan(obj):
            return None
        return super().default(obj)


def _session_dir(session_id: str) -> Path:
    p = DATA_DIR / session_id
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_session(session_id: str, reports: Dict[str, Any]) -> None:
    d = _session_dir(session_id)
    for name, data in reports.items():
        with open(d / f"{name}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2, cls=_NanSafeEncoder)


def load_report(session_id: str, report_name: str) -> Optional[Dict]:
    path = DATA_DIR / session_id / f"{report_name}.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)
