#!/usr/bin/env python3
"""
Plot evaluated-model metrics (2D) from one or more Markdown reports.

Makes separate 2D charts for:
- Accuracy
- F1 (micro, macro)
- Jaccard (micro, macro)
- Precision (micro)
- Recall (micro)

Each model is assigned a consistent color across all charts.

Usage:
  python plot_metrics_2d.py --inputs report1.md report2.md --outdir plots

Notes:
- Models with missing metrics for a plot are shown as "NA" and hatched.
- Only sections that have at least accuracy or micro-F1 are treated as "evaluated models".
"""

from __future__ import annotations

import argparse
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import numpy as np
import matplotlib.pyplot as plt


# -----------------------------
# Parsing
# -----------------------------

SECTION_HDR_RE = re.compile(r"^\s*##\s+(?P<title>.+?)\s*$", re.MULTILINE)

# Accuracy lines often appear as:
# - accuracy: 0.9867
# - accuracy (exact match): 0.9667
# Exact-match accuracy (subset): 0.9631
ACC_PATTERNS = [
    re.compile(r"^\s*-\s*accuracy[^:]*:\s*(?P<v>[0-9]*\.?[0-9]+)\s*$", re.MULTILINE),
    re.compile(r"^\s*Exact-match accuracy[^:]*:\s*(?P<v>[0-9]*\.?[0-9]+)\s*$", re.MULTILINE),
    re.compile(r"^\s*accuracy\s*\(exact match\)[^:]*:\s*(?P<v>[0-9]*\.?[0-9]+)\s*$", re.MULTILINE),
]

# Micro/macro lines often appear as:
# - micro: 0.9729 / 0.9729 / 0.9729
# Precision/Recall/F1 micro: 0.9631 / 0.9631 / 0.9631
PRF_PATTERNS = [
    re.compile(
        r"^\s*(?:-\s*)?(?:Precision/Recall/F1\s*)?(?P<avg>micro|macro)\s*:\s*"
        r"(?P<p>[0-9]*\.?[0-9]+)\s*/\s*(?P<r>[0-9]*\.?[0-9]+)\s*/\s*(?P<f>[0-9]*\.?[0-9]+)\s*$",
        re.MULTILINE,
    )
]

# Jaccard lines often appear as:
# - micro/macro/weighted/samples: 0.9734 / 0.9629 / 0.9739 / 0.9865
# Jaccard micro/macro/weighted/samples: 0.8780 / 0.8781 / ...
JACCARD_PATTERNS = [
    re.compile(
        r"^\s*(?:-\s*)?(?:Jaccard\s*)?micro\s*/\s*macro\s*/\s*weighted\s*/\s*samples\s*:\s*"
        r"(?P<micro>[0-9]*\.?[0-9]+)\s*/\s*(?P<macro>[0-9]*\.?[0-9]+)\s*/\s*(?P<w>[0-9]*\.?[0-9]+)\s*/\s*(?P<s>[0-9]*\.?[0-9]+)\s*$",
        re.MULTILINE,
    ),
    re.compile(
        r"^\s*(?:-\s*)?micro\s*/\s*macro\s*/\s*weighted\s*/\s*samples\s*:\s*"
        r"(?P<micro>[0-9]*\.?[0-9]+)\s*/\s*(?P<macro>[0-9]*\.?[0-9]+)\s*/\s*(?P<w>[0-9]*\.?[0-9]+)\s*/\s*(?P<s>[0-9]*\.?[0-9]+)\s*$",
        re.MULTILINE,
    ),
]


@dataclass
class ModelMetrics:
    name: str
    accuracy: Optional[float] = None

    precision_micro: Optional[float] = None
    recall_micro: Optional[float] = None
    f1_micro: Optional[float] = None

    precision_macro: Optional[float] = None
    recall_macro: Optional[float] = None
    f1_macro: Optional[float] = None

    jaccard_micro: Optional[float] = None
    jaccard_macro: Optional[float] = None


def split_sections(md: str) -> List[Tuple[str, str]]:
    """Return list of (section_title, section_body)."""
    matches = list(SECTION_HDR_RE.finditer(md))
    if not matches:
        return []

    sections: List[Tuple[str, str]] = []
    for i, m in enumerate(matches):
        title = m.group("title").strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md)
        body = md[start:end]
        sections.append((title, body))
    return sections


def _first_float(patterns: List[re.Pattern], text: str) -> Optional[float]:
    for pat in patterns:
        m = pat.search(text)
        if m:
            return float(m.group("v"))
    return None


def parse_one_section(title: str, body: str) -> ModelMetrics:
    mm = ModelMetrics(name=title)

    # Accuracy
    mm.accuracy = _first_float(ACC_PATTERNS, body)

    # Precision/Recall/F1 (micro & macro)
    for pat in PRF_PATTERNS:
        for m in pat.finditer(body):
            avg = m.group("avg").lower()
            p = float(m.group("p"))
            r = float(m.group("r"))
            f = float(m.group("f"))
            if avg == "micro":
                mm.precision_micro, mm.recall_micro, mm.f1_micro = p, r, f
            elif avg == "macro":
                mm.precision_macro, mm.recall_macro, mm.f1_macro = p, r, f

    # Jaccard (micro & macro)
    for pat in JACCARD_PATTERNS:
        m = pat.search(body)
        if m:
            mm.jaccard_micro = float(m.group("micro"))
            mm.jaccard_macro = float(m.group("macro"))
            break

    return mm


def parse_markdown_files(paths: List[str]) -> List[ModelMetrics]:
    merged: Dict[str, ModelMetrics] = {}

    for path in paths:
        with open(path, "r", encoding="utf-8") as f:
            md = f.read()

        for title, body in split_sections(md):
            mm = parse_one_section(title, body)

            # Keep only "evaluated" sections (has accuracy or micro-F1 at minimum)
            if mm.accuracy is None and mm.f1_micro is None:
                continue

            # Merge (later files can fill missing fields)
            if title not in merged:
                merged[title] = mm
            else:
                prev = merged[title]
                for field in prev.__dataclass_fields__.keys():
                    if field == "name":
                        continue
                    if getattr(prev, field) is None and getattr(mm, field) is not None:
                        setattr(prev, field, getattr(mm, field))

    models = list(merged.values())

    # Stable order: highest micro-F1 first (if available), then name.
    def sort_key(x: ModelMetrics):
        mf = x.f1_micro if x.f1_micro is not None else -1.0
        return (-mf, x.name.lower())

    models.sort(key=sort_key)
    return models


# -----------------------------
# Plotting
# -----------------------------

def assign_colors(names: List[str]):
    n = len(names)
    if n <= 20:
        cmap = plt.get_cmap("tab20", n)
        return [cmap(i) for i in range(n)]
    # fallback: evenly spaced HSV
    hsv = plt.get_cmap("hsv", n)
    return [hsv(i) for i in range(n)]


def to_array(models: List[ModelMetrics], attr: str) -> np.ndarray:
    vals = []
    for m in models:
        v = getattr(m, attr)
        vals.append(np.nan if v is None else float(v))
    return np.array(vals, dtype=float)


def plot_barh(
    models: List[ModelMetrics],
    colors: List,
    values: np.ndarray,
    title: str,
    outpath: str,
    xlabel: str = "Score",
    xlim: Tuple[float, float] = (0.0, 1.02),
):
    names = [m.name for m in models]
    y = np.arange(len(names))

    plot_vals = np.nan_to_num(values, nan=0.0)

    fig, ax = plt.subplots(figsize=(12, max(6, 0.35 * len(names))))
    bars = ax.barh(y, plot_vals, color=colors)

    # Hatch + annotate NA for missing values
    for i, (b, v) in enumerate(zip(bars, values)):
        if np.isnan(v):
            b.set_hatch("//")
            b.set_alpha(0.35)
            ax.text(0.01, b.get_y() + b.get_height() / 2, "NA", va="center")
        else:
            ax.text(
                min(v + 0.01, xlim[1] - 0.01),
                b.get_y() + b.get_height() / 2,
                f"{v:.3f}",
                va="center",
            )

    ax.set_yticks(y)
    ax.set_yticklabels(names)
    ax.invert_yaxis()
    ax.set_title(title)
    ax.set_xlabel(xlabel)
    ax.set_xlim(*xlim)
    ax.grid(True, axis="x", alpha=0.25)

    fig.tight_layout()
    fig.savefig(outpath, dpi=200)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inputs", nargs="+", required=True, help="Markdown report file(s)")
    ap.add_argument("--outdir", default="plots", help="Output directory for PNGs")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    models = parse_markdown_files(args.inputs)
    if not models:
        raise SystemExit("No evaluated model sections found (need at least accuracy or micro-F1).")

    names = [m.name for m in models]
    colors = assign_colors(names)

    # Build arrays (numpy) for each plot
    metrics_to_plot = [
        ("accuracy", "Accuracy", "Accuracy"),
        ("f1_micro", "F1 (Micro)", "F1 score"),
        ("f1_macro", "F1 (Macro)", "F1 score"),
        ("jaccard_micro", "Jaccard (Micro)", "Jaccard"),
        ("jaccard_macro", "Jaccard (Macro)", "Jaccard"),
        ("precision_micro", "Precision (Micro)", "Precision"),
        ("recall_micro", "Recall (Micro)", "Recall"),
    ]

    for attr, title, xlabel in metrics_to_plot:
        vals = to_array(models, attr)
        outpath = os.path.join(args.outdir, f"{attr}.png")
        plot_barh(models, colors, vals, title=title, outpath=outpath, xlabel=xlabel)

    print(f"Saved {len(metrics_to_plot)} plots to: {args.outdir}")


if __name__ == "__main__":
    main()
