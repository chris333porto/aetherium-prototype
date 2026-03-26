"""
Aetherium MVP — Codebase Review PDF Generator
Generates a structured PDF of all source files for external review.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    HRFlowable, Preformatted
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Output path ───────────────────────────────────────────────────────────────
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(os.path.expanduser("~/Desktop"), "Aetherium_MVP_Review.pdf")

# ── Colours ───────────────────────────────────────────────────────────────────
BG       = colors.HexColor("#08080e")
PURPLE   = colors.HexColor("#9590ec")
MUTED    = colors.HexColor("#888899")
WHITE    = colors.HexColor("#eae8f2")
DIM      = colors.HexColor("#555566")
CODE_BG  = colors.HexColor("#0d0d18")
RULE_CLR = colors.HexColor("#222233")

# ── Styles ────────────────────────────────────────────────────────────────────
base_styles = getSampleStyleSheet()

TITLE_STYLE = ParagraphStyle(
    "AeTitle",
    fontSize=28,
    leading=34,
    textColor=WHITE,
    fontName="Helvetica-Bold",
    spaceAfter=6,
    alignment=TA_LEFT,
)
SUBTITLE_STYLE = ParagraphStyle(
    "AeSubtitle",
    fontSize=11,
    leading=16,
    textColor=PURPLE,
    fontName="Helvetica",
    spaceAfter=4,
    alignment=TA_LEFT,
    letterSpacing=2,
)
SECTION_STYLE = ParagraphStyle(
    "AeSection",
    fontSize=14,
    leading=18,
    textColor=WHITE,
    fontName="Helvetica-Bold",
    spaceBefore=24,
    spaceAfter=6,
)
FILE_HEADER_STYLE = ParagraphStyle(
    "AeFileHeader",
    fontSize=10,
    leading=14,
    textColor=PURPLE,
    fontName="Helvetica-Bold",
    spaceBefore=18,
    spaceAfter=4,
    leftIndent=0,
)
BODY_STYLE = ParagraphStyle(
    "AeBody",
    fontSize=9,
    leading=14,
    textColor=MUTED,
    fontName="Helvetica",
    spaceAfter=4,
)
CODE_STYLE = ParagraphStyle(
    "AeCode",
    fontSize=7,
    leading=10,
    textColor=colors.HexColor("#c8c6d8"),
    fontName="Courier",
    leftIndent=0,
    spaceAfter=2,
    backColor=CODE_BG,
    borderPad=6,
)

# ── File manifest ─────────────────────────────────────────────────────────────
SECTIONS = [
    ("Overview", None, None),
    ("Foundation", None, None),
    ("app/globals.css",              "Foundation",  "CSS"),
    ("app/layout.tsx",               "Foundation",  "TSX"),
    ("UI Components", None, None),
    ("components/ui/Button.tsx",     "UI Components", "TSX"),
    ("components/ui/Card.tsx",       "UI Components", "TSX"),
    ("components/ui/Input.tsx",      "UI Components", "TSX"),
    ("components/ui/Progress.tsx",   "UI Components", "TSX"),
    ("components/ui/Section.tsx",    "UI Components", "TSX"),
    ("components/ui/Container.tsx",  "UI Components", "TSX"),
    ("components/DimensionChart.tsx","UI Components", "TSX"),
    ("Core Logic", None, None),
    ("lib/assessment/questions.ts",  "Core Logic", "TS"),
    ("lib/scoring/engine.ts",        "Core Logic", "TS"),
    ("lib/archetypes/definitions.ts","Core Logic", "TS"),
    ("lib/archetypes/matcher.ts",    "Core Logic", "TS"),
    ("lib/pathways/growth.ts",       "Core Logic", "TS"),
    ("lib/supabase.ts",              "Core Logic", "TS"),
    ("Pages", None, None),
    ("app/page.tsx",                 "Pages", "TSX"),
    ("app/auth/page.tsx",            "Pages", "TSX"),
    ("app/onboarding/welcome/page.tsx", "Pages", "TSX"),
    ("app/assessment/page.tsx",      "Pages", "TSX"),
    ("app/generating/page.tsx",      "Pages", "TSX"),
    ("app/results/page.tsx",         "Pages", "TSX"),
    ("Database", None, None),
    ("supabase/migrations/001_initial_schema.sql", "Database", "SQL"),
]

def read_file(rel_path):
    full = os.path.join(BASE, rel_path)
    try:
        with open(full, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return f"[File not found: {rel_path}]"

def safe_text(text):
    """Escape special chars for Paragraph."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def make_code_block(content):
    """Split code into Preformatted paragraphs (one per line, capped width)."""
    lines = content.split("\n")
    # Cap very long lines
    MAX = 110
    capped = []
    for line in lines:
        if len(line) > MAX:
            capped.append(line[:MAX] + " …")
        else:
            capped.append(line)
    return Preformatted("\n".join(capped), CODE_STYLE)

def build_overview():
    items = []
    items.append(Paragraph("AETHERIUM MVP", TITLE_STYLE))
    items.append(Paragraph("CODEBASE REVIEW DOCUMENT", SUBTITLE_STYLE))
    items.append(Spacer(1, 0.1 * inch))
    items.append(HRFlowable(width="100%", thickness=0.5, color=RULE_CLR))
    items.append(Spacer(1, 0.15 * inch))

    overview_text = [
        ("<b>What is Aetherium?</b>",
         "A closed-loop identity evolution system. Not a personality test — a dynamic state mapping system built on 5 human dimensions."),
        ("<b>Core Loop</b>",
         "Assessment → Profile → Guidance → Reassessment → Evolution"),
        ("<b>Tech Stack</b>",
         "Next.js 16.2.1 (App Router) · React 19.2.4 · Tailwind CSS v4 · Supabase · TypeScript strict mode"),
        ("<b>The 5 Dimensions</b>",
         "AETHER (Intention/Purpose) · FIRE (Volition/Drive) · AIR (Cognition/Clarity) · WATER (Emotion/Connection) · EARTH (Execution/Grounding)"),
        ("<b>Archetype System</b>",
         "32 archetypes across 5 evolution states: Fragmented → Emerging → Integrated → Advanced → Unified. Users get a weighted blend of top 3 + shadow archetype."),
        ("<b>Scoring</b>",
         "50 Likert questions (10/dimension). Deterministic: reverse-scored → averaged → normalized to 0–100 → bucketed → coherence computed."),
        ("<b>Growth System</b>",
         "Weakest dimension identified → adjacent-state archetypes with high expression of that dimension → 3 pathway options → YOU → NEXT → FUTURE."),
        ("<b>Results Screen</b>",
         "6 sections: Identity (archetype blend + radar chart) · Dimensional State · Growth Edge · Evolution Pathway · Practices · Primary Archetype."),
        ("<b>Data Flow</b>",
         "Answers → localStorage → /generating (scoring runs client-side) → localStorage → /results (render). Supabase schema ready, persistence not yet wired."),
        ("<b>Current Status</b>",
         "Runs locally, zero errors. Full assessment flow end-to-end. All output connected to computed data. Auth stub (routes to onboarding without real sign-in). Supabase tables created but persistence not wired yet."),
    ]

    for label, body in overview_text:
        items.append(Paragraph(label, ParagraphStyle("lbl", parent=BODY_STYLE,
            textColor=WHITE, fontName="Helvetica-Bold", fontSize=9, spaceBefore=8)))
        items.append(Paragraph(safe_text(body), BODY_STYLE))

    items.append(Spacer(1, 0.2 * inch))

    # File index
    items.append(Paragraph("FILE INDEX", ParagraphStyle("idx", parent=SUBTITLE_STYLE, spaceBefore=12)))
    items.append(HRFlowable(width="100%", thickness=0.5, color=RULE_CLR))
    items.append(Spacer(1, 0.08 * inch))

    file_entries = [s[0] for s in SECTIONS if s[1] is not None]
    for entry in file_entries:
        items.append(Paragraph(f"  {safe_text(entry)}", ParagraphStyle(
            "fentry", parent=BODY_STYLE, fontSize=8, spaceAfter=1,
            textColor=colors.HexColor("#8888aa"))))

    return items

def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=letter,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Aetherium MVP — Codebase Review",
        author="Aetherium",
    )

    story = []

    # Cover / overview
    story.extend(build_overview())
    story.append(PageBreak())

    current_section = None

    for entry in SECTIONS:
        path, section, _lang = entry

        # Section header (no file path = section divider)
        if section is None:
            if path == "Overview":
                continue
            # Section header page marker
            story.append(Spacer(1, 0.1 * inch))
            story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_CLR))
            story.append(Paragraph(path.upper(), ParagraphStyle(
                "sec", parent=SECTION_STYLE,
                textColor=PURPLE, fontSize=12, letterSpacing=3,
            )))
            story.append(HRFlowable(width="100%", thickness=0.5, color=RULE_CLR))
            current_section = path
            continue

        # File entry
        content = read_file(path)
        line_count = content.count("\n") + 1

        story.append(Paragraph(f"📄  {safe_text(path)}", FILE_HEADER_STYLE))
        story.append(Paragraph(
            f"{line_count} lines &nbsp;·&nbsp; {section}",
            ParagraphStyle("fmeta", parent=BODY_STYLE, fontSize=7.5,
                           textColor=DIM, spaceAfter=4)
        ))
        story.append(HRFlowable(width="100%", thickness=0.3, color=RULE_CLR))
        story.append(Spacer(1, 0.04 * inch))
        story.append(make_code_block(content))
        story.append(Spacer(1, 0.1 * inch))

    doc.build(story)
    print(f"✓ PDF written to: {OUTPUT}")

if __name__ == "__main__":
    build()
