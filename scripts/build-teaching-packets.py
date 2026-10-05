"""Build the four downloadable sheets from the same data as their accessible HTML pages."""
from pathlib import Path
import json
import html
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, Flowable
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data/teaching-packets.json").read_text(encoding="utf-8"))
OUT = ROOT / "public/teach"
OUT.mkdir(exist_ok=True)
FONT_DIR = Path("C:/Windows/Fonts")
if (FONT_DIR / "arial.ttf").exists():
    pdfmetrics.registerFont(TTFont("PacketSans", str(FONT_DIR / "arial.ttf")))
    pdfmetrics.registerFont(TTFont("PacketSansBold", str(FONT_DIR / "arialbd.ttf")))
    pdfmetrics.registerFontFamily("PacketSans", normal="PacketSans", bold="PacketSansBold")
    FONT, BOLD = "PacketSans", "PacketSansBold"
else:
    FONT, BOLD = "Helvetica", "Helvetica-Bold"

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="PacketTitle", fontName=BOLD, fontSize=24, leading=29, spaceAfter=12))
styles.add(ParagraphStyle(name="PacketHeading", fontName=BOLD, fontSize=13, leading=16, spaceBefore=12, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name="PacketBody", fontName=FONT, fontSize=10.5, leading=14, spaceAfter=8, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="PacketMeta", fontName=FONT, fontSize=8.5, leading=11, spaceAfter=6))

def clean(text):
    return text.replace("\u2013", "-").replace("\u2014", "-").replace("\u2011", "-").replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')

def paragraph(text, style="PacketBody"):
    return Paragraph(html.escape(clean(text)), styles[style])

class AnswerLines(Flowable):
    def __init__(self):
        super().__init__()
        self.height = 24
    def draw(self):
        self.canv.setStrokeColor(colors.HexColor("#bdbab1"))
        self.canv.setLineWidth(0.4)
        for y in (7, 21):
            self.canv.line(0, y, self._width, y)
    def wrap(self, availWidth, availHeight):
        self._width = availWidth
        return availWidth, self.height

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#bdbab1"))
    canvas.line(44, 40, 568, 40)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(colors.HexColor("#5f5d57"))
    canvas.drawString(44, 27, "Israel Votes 2026 | Teaching material | Prepared 2026-10-05")
    canvas.drawRightString(568, 27, str(doc.page))
    canvas.restoreState()

for packet in DATA["packets"]:
    for role in ("learner", "facilitator"):
        output = OUT / f"{packet['id']}-{role}.pdf"
        story = [paragraph(packet["title"], "PacketTitle"), paragraph(f"{'Learner sheet' if role == 'learner' else 'Facilitator notes'} | {packet['minutes']} minutes | Prepared {DATA['checked']}", "PacketMeta"), paragraph(f"For: {packet['audience']}"), paragraph(f"Before you start: {packet['prerequisites']}"), paragraph("Learning objectives", "PacketHeading")]
        for objective in packet["objectives"]:
            story.append(paragraph("- " + objective))
        for section in packet[role]:
            heading = paragraph(section["heading"], "PacketHeading")
            if section.get("paragraphs"):
                story.append(heading)
            for text in section.get("paragraphs", []):
                story.append(KeepTogether([paragraph(text)]))
            for i, prompt in enumerate(section.get("prompts", []), 1):
                group = ([heading] if i == 1 and not section.get("paragraphs") else []) + [paragraph(f"{i}. {prompt}")]
                if role == "learner":
                    group.append(AnswerLines())
                    group.append(Spacer(1, 6))
                story.append(KeepTogether(group))
        story.append(paragraph("Sources and next steps", "PacketHeading"))
        for source in packet["sources"]:
            url = source["href"] if source["href"].startswith("http") else "https://www.israelielection.org" + source["href"]
            text = f"{source['title']} - {source['date']}"
            story.append(paragraph(text, "PacketMeta"))
            story.append(Paragraph(f'<link href="{html.escape(url, quote=True)}" color="#233f86">{html.escape(url)}</link>', styles["PacketMeta"]))
        story.append(paragraph(DATA["attribution"], "PacketMeta"))
        story.append(Paragraph('<link href="https://creativecommons.org/licenses/by-nc/4.0/">License: https://creativecommons.org/licenses/by-nc/4.0/</link>', styles["PacketMeta"]))
        canonical = f"https://www.israelielection.org/teach/packets/{packet['id']}/{role}"
        story.append(paragraph("Accessible HTML version: " + canonical, "PacketMeta"))
        SimpleDocTemplate(str(output), pagesize=(612, 792), leftMargin=44, rightMargin=44, topMargin=36, bottomMargin=50, title=f"{packet['title']} - {role}", author="Rabbi Daniel Bogard / Israel Votes 2026").build(story, onFirstPage=footer, onLaterPages=footer)
        print(output.name)
