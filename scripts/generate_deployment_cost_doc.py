"""Generate Deployment_Cost_Estimate_50_Users.docx"""
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from pathlib import Path


def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor(*color)


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_border(cell):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        element = OxmlElement(f"w:{edge}")
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "666666")
        tcBorders.append(element)
    tcPr.append(tcBorders)


def main():
    doc = Document()
    for section in doc.sections:
        section.top_margin = Cm(1.5)
        section.bottom_margin = Cm(1.5)
        section.left_margin = Cm(1.5)
        section.right_margin = Cm(1.5)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(title.add_run("Deployment Cost Estimate"), 20, True, (0, 51, 102))

    subtitle = doc.add_paragraph()
    subtitle.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(
        subtitle.add_run("PMJAY / Website Dashboard — Production Infrastructure"),
        13,
        True,
        (51, 51, 51),
    )

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(
        meta.add_run(
            "Users: 50  |  Data: ~30 crore rows (on client DB server)  |  Region: AWS Mumbai (ap-south-1)\n"
            "Stack: React frontend + Node.js backend + Redis  |  Database: existing client server (excluded)\n"
            "Currency: Indian Rupees (₹)"
        ),
        10,
        False,
        (80, 80, 80),
    )

    doc.add_paragraph()
    p = doc.add_paragraph()
    set_run_font(p.add_run("Purpose: "), 11, True)
    set_run_font(
        p.add_run(
            "This document lists the cloud infrastructure cost for hosting the dashboard application "
            "(frontend, backend API, domain, SSL, cache, file storage, and monitoring). "
            "Database hosting is excluded because the client will use their existing database server. "
            "Amounts are approximate estimates for budgeting / procurement. "
            "Confirm final pricing with the AWS Pricing Calculator before purchase."
        ),
        11,
    )

    headers = [
        "#",
        "Component",
        "Service / Plan",
        "Specification",
        "Why we need it",
        "₹ / Month",
        "₹ / Year",
    ]

    rows = [
        [
            "1",
            "Backend API server",
            "EC2 or ECS Fargate",
            "1 server, 8 vCPU / 16 GB RAM (Node.js / Express)",
            "Runs all APIs and in-app aggregations (KPI/charts/exports). 8 vCPU / 16 GB is comfortable headroom for ~50 users.",
            "28,000",
            "3,36,000",
        ],
        [
            "2",
            "Frontend hosting",
            "Amazon S3 + CloudFront",
            "Static React build + CDN",
            "Serves the website UI quickly across India at low cost; separates static UI from the API server.",
            "1,000",
            "12,000",
        ],
        [
            "3",
            "SSL certificate",
            "AWS Certificate Manager (ACM)",
            "Free public HTTPS certificate",
            "Encrypts all traffic (HTTPS). Required for secure login and browser trust.",
            "0",
            "0",
        ],
        [
            "4",
            "Domain + DNS",
            "Domain registrar + Route 53",
            "1 domain (.in / .com) + DNS hosting",
            "Provides the public URL (e.g. dashboard.yourorg.in) and routes users to frontend and API.",
            "150",
            "1,800",
        ],
        [
            "5",
            "Cache",
            "Amazon ElastiCache Redis",
            "~1.5 GB (cache.t4g.small)",
            "Caches KPI and summary results so the same heavy queries are not re-run on every page load.",
            "3,500",
            "42,000",
        ],
        [
            "6",
            "File / export storage",
            "Amazon S3",
            "Uploads, Excel exports, file backups",
            "Stores imported files and downloadable reports without filling the application server disk.",
            "1,000",
            "12,000",
        ],
        [
            "7",
            "Monitoring & logs",
            "Amazon CloudWatch",
            "Application logs + basic alarms",
            "Detects downtime, high CPU, or disk pressure early so the system stays stable with limited ops staff.",
            "2,000",
            "24,000",
        ],
        [
            "8",
            "Internet data transfer",
            "AWS data transfer / CDN egress",
            "Light usage (~50 users)",
            "Cost of users loading pages and downloading reports from the internet.",
            "1,500",
            "18,000",
        ],
    ]

    table = doc.add_table(rows=1 + len(rows) + 2, cols=7)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = ""
        set_run_font(cell.paragraphs[0].add_run(h), 9, True, (255, 255, 255))
        shade_cell(cell, "003366")
        set_cell_border(cell)

    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = ""
            set_run_font(cell.paragraphs[0].add_run(val), 8, False)
            if r_idx % 2 == 1:
                shade_cell(cell, "F2F6FA")
            set_cell_border(cell)

    subtotal = ["", "Subtotal", "", "", "", "37,150", "4,45,800"]
    for c_idx, val in enumerate(subtotal):
        cell = table.rows[len(rows) + 1].cells[c_idx]
        cell.text = ""
        set_run_font(cell.paragraphs[0].add_run(val), 9, True)
        shade_cell(cell, "D9E8F5")
        set_cell_border(cell)

    gst = [
        "9",
        "GST (~18%)",
        "Tax (AWS India billing)",
        "On applicable cloud services",
        "Statutory GST when billed through AWS India.",
        "6,687",
        "80,244",
    ]
    for c_idx, val in enumerate(gst):
        cell = table.rows[len(rows) + 2].cells[c_idx]
        cell.text = ""
        set_run_font(cell.paragraphs[0].add_run(val), 8, False)
        shade_cell(cell, "FFF2CC")
        set_cell_border(cell)

    doc.add_paragraph()
    gt = doc.add_paragraph()
    set_run_font(
        gt.add_run(
            "Grand total (including GST):  ≈ ₹43,800 per month  |  ≈ ₹5,26,000 per year"
        ),
        12,
        True,
        (0, 102, 51),
    )

    note_db = doc.add_paragraph()
    set_run_font(
        note_db.add_run(
            "Excluded: Primary database, DB storage, read replica, and DB backups — "
            "client will use their existing database server (cost not included in this estimate)."
        ),
        10,
        True,
        (153, 0, 0),
    )

    doc.add_paragraph()
    h = doc.add_paragraph()
    set_run_font(h.add_run("Architecture (simple flow)"), 14, True, (0, 51, 102))

    arch = doc.add_paragraph()
    set_run_font(
        arch.add_run(
            "User → Domain + HTTPS (Route 53 / ACM)\n"
            "    → Frontend (S3 + CloudFront)\n"
            "    → Backend API (EC2 / Fargate)\n"
            "        → Redis cache (KPI results)\n"
            "        → Client existing PostgreSQL server (data)"
        ),
        10,
    )

    h2 = doc.add_paragraph()
    set_run_font(h2.add_run("Important notes"), 14, True, (0, 51, 102))

    notes = [
        "Database hosting cost is excluded — the client provides and manages their own DB server.",
        "Application must be able to connect securely to the client DB (VPN / private link / allowlisted IP + SSL).",
        "Revised for ~50 users. Backend 8 vCPU / 16 GB RAM remains comfortable for this concurrency.",
        "Redis cache is still recommended so repeated KPI queries do not overload the client DB.",
        "Prices are approximate estimates (blended on-demand / 1-year reserved). Reconfirm with AWS Pricing Calculator before procurement.",
        "1-year Reserved Instance / Savings Plan on EC2 can reduce compute cost by roughly 30–40% versus pure on-demand.",
        "This estimate assumes internal/dashboard use only (not a public high-traffic portal).",
    ]
    for n in notes:
        para = doc.add_paragraph(style="List Number")
        para.clear()
        set_run_font(para.add_run(n), 10)

    doc.add_paragraph()
    f = doc.add_paragraph()
    set_run_font(
        f.add_run("Document prepared for internal budgeting. Not a vendor quotation."),
        9,
        False,
        (120, 120, 120),
    )

    out = Path(__file__).resolve().parents[1] / "Deployment_Cost_Estimate_50_Users_App_Only.docx"
    doc.save(out)
    print(str(out))


if __name__ == "__main__":
    main()
