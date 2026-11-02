"""Build a single PowerPoint combining SRS + FRS for the PM-JAY MP Analytics Dashboard."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

GREEN = RGBColor(0x1A, 0x5C, 0x38)
GREEN_MID = RGBColor(0x2D, 0x8A, 0x4E)
GREEN_LIGHT = RGBColor(0xE8, 0xF5, 0xEE)
SLATE = RGBColor(0x1E, 0x29, 0x3B)
MUTED = RGBColor(0x64, 0x74, 0x8B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BG = RGBColor(0xF7, 0xFB, 0xF9)
SOFT = RGBColor(0xD4, 0xEE, 0xDD)


def set_run(run, size=14, bold=False, color=SLATE, font="Calibri"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_bg(slide, color=LIGHT_BG):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    spTree = slide.shapes._spTree
    sp = shape._element
    spTree.remove(sp)
    spTree.insert(2, sp)


def add_header_bar(slide, title):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.95))
    bar.fill.solid()
    bar.fill.fore_color.rgb = GREEN
    bar.line.fill.background()
    # accent strip
    strip = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(0.95), Inches(13.333), Inches(0.08))
    strip.fill.solid()
    strip.fill.fore_color.rgb = GREEN_MID
    strip.line.fill.background()

    tf = bar.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.55)
    tf.margin_top = Inches(0.22)
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = title
    set_run(run, 20, True, WHITE)


def add_footer(slide, page, total):
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(6.95), Inches(12.2), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = RGBColor(0xCB, 0xD5, 0xE1)
    line.line.fill.background()

    box = slide.shapes.add_textbox(Inches(0.55), Inches(7.05), Inches(12.2), Inches(0.3))
    tf = box.text_frame
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = f"PM-JAY MP Analytics Dashboard   ·   SRS & FRS   ·   Confidential"
    set_run(run, 10, False, MUTED)
    p2 = tf.add_paragraph()
    # put page on same line via right-aligned separate box
    page_box = slide.shapes.add_textbox(Inches(11.2), Inches(7.05), Inches(1.55), Inches(0.3))
    pf = page_box.text_frame.paragraphs[0]
    pf.alignment = PP_ALIGN.RIGHT
    pr = pf.add_run()
    pr.text = f"{page}  /  {total}"
    set_run(pr, 10, False, MUTED)


def add_textbox(slide, left, top, width, height, text, size=14, bold=False, color=SLATE, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run(run, size, bold, color)
    return box


def add_bullets(slide, left, top, width, height, items, size=14):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.level = item[1] if isinstance(item, tuple) else 0
        text = item[0] if isinstance(item, tuple) else item
        run = p.add_run()
        run.text = ("•  " if p.level == 0 else "    –  ") + text
        set_run(run, size - (1 if p.level else 0), False, SLATE)
        p.space_before = Pt(6)
        p.space_after = Pt(10)
        p.line_spacing = 1.25


def add_table(slide, left, top, width, rows, col_widths=None, row_h=0.48):
    cols = len(rows[0])
    table_shape = slide.shapes.add_table(
        len(rows), cols, Inches(left), Inches(top), Inches(width), Inches(row_h * len(rows))
    )
    table = table_shape.table
    if col_widths:
        for i, w in enumerate(col_widths):
            table.columns[i].width = Inches(w)
    for r, row in enumerate(rows):
        for c, val in enumerate(row):
            cell = table.cell(r, c)
            cell.text = str(val)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            for p in cell.text_frame.paragraphs:
                p.space_before = Pt(4)
                p.space_after = Pt(4)
                for run in p.runs:
                    set_run(run, 12 if r == 0 else 11, r == 0, WHITE if r == 0 else SLATE)
            fill = cell.fill
            fill.solid()
            fill.fore_color.rgb = GREEN if r == 0 else (GREEN_LIGHT if r % 2 == 0 else WHITE)


def new_content_slide(prs, title, page, total):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide)
    add_header_bar(slide, title)
    add_footer(slide, page, total)
    return slide


def build():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    total = 18

    # ——— 1 Title (open layout, not cramped) ———
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s, GREEN)
    # left accent panel
    panel = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.28), Inches(7.5))
    panel.fill.solid()
    panel.fill.fore_color.rgb = GREEN_MID
    panel.line.fill.background()

    add_textbox(s, 1.1, 1.6, 10.5, 0.45, "STATE HEALTH AGENCY  ·  MADHYA PRADESH", 13, True, SOFT)
    add_textbox(s, 1.1, 2.25, 11, 0.7, "Software Requirements Specification (SRS)", 30, True, WHITE)
    add_textbox(s, 1.1, 2.95, 11, 0.7, "& Functional Requirements Specification (FRS)", 30, True, WHITE)

    # thin divider
    div = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.1), Inches(3.85), Inches(3.2), Inches(0.06))
    div.fill.solid()
    div.fill.fore_color.rgb = GREEN_MID
    div.line.fill.background()

    add_textbox(s, 1.1, 4.2, 11, 0.5, "PM-JAY Madhya Pradesh — Health Analytics Dashboard", 18, False, SOFT)
    add_textbox(s, 1.1, 4.85, 11, 0.4, "Ayushman Bharat   |   Single combined document", 14, False, RGBColor(0xA7, 0xF3, 0xD0))
    add_textbox(s, 1.1, 5.55, 11, 0.35, "Document Version 2.0    ·    October 2026", 12, False, RGBColor(0x86, 0xEF, 0xAC))
    add_footer(s, 1, total)

    # ——— 2 Purpose ———
    s = new_content_slide(prs, "1. Purpose & Document Scope (SRS)", 2, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Purpose: Define functional and non-functional requirements for the PM-JAY MP Health Analytics Dashboard.",
            "Audience: SHA stakeholders, developers, QA, and system integrators.",
            "In scope: Role-based analytics, department dashboards, filters, drill-down, export, user admin, bulk import, audit trail.",
            "Schemas: bis_raw, dmart_mp, ump_raw, app_auth (PostgreSQL / Neon).",
            "Stack: React + TypeScript + Vite · Node/Express API · JWT cookie session · RBAC.",
            "This deck combines SRS (what the system must be) and FRS (what the system must do).",
        ],
        15,
    )

    # ——— 3 Architecture ———
    s = new_content_slide(prs, "2. System Overview & Architecture (SRS)", 3, total)
    add_table(
        s,
        0.7,
        1.4,
        11.9,
        [
            ["Layer", "Technology", "Responsibility"],
            ["UI", "React, Tailwind, Recharts", "Dashboards, charts, filters, export"],
            ["API", "Express.js REST", "Auth, aggregations, import, reports"],
            ["Data", "PostgreSQL (Neon)", "bis_raw · dmart_mp · ump_raw · app_auth"],
            ["Security", "JWT cookie + RBAC", "Login, roles, audit_log"],
            ["Deploy", "Vercel (FE) / Render (API)", "Production-ready hosting"],
        ],
        [2.4, 4.0, 5.5],
        0.55,
    )

    # ——— 4 Roles ———
    s = new_content_slide(prs, "3. User Roles & Access Control (SRS)", 4, total)
    add_table(
        s,
        0.7,
        1.4,
        11.9,
        [
            ["Role", "Landing page", "Access"],
            ["super_admin", "User Management", "All modules"],
            ["state_admin", "Overview", "All modules"],
            ["bis_user", "BIS Card Printing", "BIS + Import"],
            ["mp_user", "MP Claims", "MP modules + Import"],
            ["ump_user", "UMP Users", "UMP + Import"],
        ],
        [3.2, 3.8, 4.9],
        0.55,
    )

    # ——— 5 Functions ———
    s = new_content_slide(prs, "4. Product Functions Summary (SRS)", 5, total)
    add_table(
        s,
        0.7,
        1.35,
        11.9,
        [
            ["ID", "Function", "Description"],
            ["F1", "Authentication", "Role-based login, session, logout"],
            ["F2", "Navigation", "Sidebar filtered by role"],
            ["F3", "Overview", "Cross-department KPIs & charts"],
            ["F4", "Department dashboards", "BIS, Claims, Hospitals, Fraud, etc."],
            ["F5", "Filtering", "Division, district, dates, search"],
            ["F6", "Drill-down", "KPI / chart / table → detail modal"],
            ["F7", "Export", "CSV, Excel, PDF (all matching rows)"],
            ["F8", "User admin & audit", "CRUD users + persistent audit log"],
            ["F9", "Bulk import", "CSV / Excel → registry tables"],
        ],
        [1.3, 3.4, 7.2],
        0.42,
    )

    # ——— 6 Auth ———
    s = new_content_slide(prs, "5. FRS — Authentication & Navigation", 6, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "AUTH: Login with username + password + role; validate against app_auth.dashboard_users; role-based redirect; session cookie; block unauthenticated routes; logout; government branding.",
            "NAV: Brand header; collapsible sidebar; mobile drawer; role-filtered menu; nested MP groups (Hospitals & Patients, Fraud and Audit).",
            "Sidebar: Overview · BIS · Madhya Pradesh · User Management · Import · UMP.",
        ],
        15,
    )

    # ——— 7 Overview BIS ———
    s = new_content_slide(prs, "6. FRS — Overview & BIS Card Printing", 7, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Overview: KPI cards (beneficiaries, claims, hospitals, patients, fraud, etc.) with month-over-month change; charts; geo + date filters; drill-down to live records.",
            "BIS: Card printing KPIs & charts; batches; already-printed dedup; schema bis_raw / card printing tables.",
            "Pages: Card Printing Status · Card Print Batches · Already Printed Cards.",
        ],
        15,
    )

    # ——— 8 Claims ———
    s = new_content_slide(prs, "7. FRS — Claims, Payments & Beneficiaries", 8, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Claims: Status Dashboard · Payment Details · Master Report TMS — KPIs, trends, payment breakdown, case tables.",
            "Sources: claim_paid_excel_t, claim_paid_t, t_payment_dtls, portability tables.",
            "Beneficiaries: Enrollment, card, Aadhaar, urban/rural, eKYC, PVTG, disabled snapshots — KPIs, charts, multi-section tables.",
            "Sources: t_bis_beneficiary_dtls / hist, m_source_data, disabled, eKYC, bis_raw.",
        ],
        15,
    )

    # ——— 9 Hospitals ———
    s = new_content_slide(prs, "8. FRS — Hospitals, Patients & Doctors", 9, total)
    add_bullets(
        s,
        0.7,
        1.3,
        11.8,
        5.3,
        [
            "Hospitals & Patients menu includes:",
            ("Hospital Master — empanelment, type, geography, NABH, active serving", 1),
            ("De-empanelment · HEM Hospitals · HEM Manpower · Hospital Lookup", 1),
            ("Patients & Treatment — admissions, specialty, MORTH, stratification", 1),
            ("Doctor Details — doctor_details_with_registartionandcaseid", 1),
            ("ICD Doctor Details — icd_data_doctor_details (kept separate)", 1),
            "Import tables for both doctor datasets are under Hospitals & Patients.",
        ],
        14,
    )

    # ——— 10 Fraud ———
    s = new_content_slide(prs, "9. FRS — Fraud & Audit (SAFU)", 10, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Views: Overall · Doctor-wise · SHA-AFO-wise · Trigger analytics.",
            "KPIs: Suspicious cases, investigation status, entity / application / fraud type, hospitals, amounts, triggers.",
            "Charts: entity type, fraud type, district, trigger type/code, recovery, doctor/officer workload.",
            "Sources: t_suspicious_api_case_data, t_suspicious_api_case_dtls; NAFU/SAFU Source → m_nafu_safu_source.",
            "Drill-down dates use crt_date / lst_trigger_event_date.",
        ],
        14,
    )

    # ——— 11 Workflow ———
    s = new_content_slide(prs, "10. FRS — Workflow, LMS & UMP", 11, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Users & Workflow: workflow_users_t, pro_workflow_users_t, audit trails, status masters.",
            "LMS Training: course completion KPIs/charts from lms_user_course_completion_status.",
            "UMP User Master: ump_raw user master KPIs (status, gender, state).",
            "Standalone Reports catalog with per-module loaders and table graphs.",
        ],
        15,
    )

    # ——— 12 Admin ———
    s = new_content_slide(prs, "11. FRS — User Management & Audit Trail", 12, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Tabs: Users · Roles · Permissions · Audit Logs.",
            "Users: list / create / activate-deactivate / reset password via API (app_auth.dashboard_users).",
            "Audit Logs: persisted in app_auth.audit_log — LOGIN / LOGOUT, user changes, import actions, ACCESS_DENIED.",
            "Columns: Timestamp, User, Role, Action, Module, IP, Status — loaded from server on Refresh.",
        ],
        15,
    )

    # ——— 13 Import ———
    s = new_content_slide(prs, "12. FRS — Import, Filters, Drill-down & Export", 13, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "Import: Upload CSV/Excel; suggest table from schemaRegistry; map columns; validate; commit with dedupe keys.",
            "Filters: Division ↔ District cascade; date presets (Today, Last 7/30, This year, Previous year, Custom); search; persist across refresh.",
            "Drill-down: KPI / chart / row → DetailModal with search, filters, export.",
            "Export: CSV, Excel, downloadable PDF with all matching rows; full-page PDF from chart snapshots.",
        ],
        14,
    )

    # ——— 14 NFR ———
    s = new_content_slide(prs, "13. Non-Functional Requirements (SRS)", 14, total)
    add_table(
        s,
        0.7,
        1.4,
        11.9,
        [
            ["Area", "Requirement"],
            ["Performance", "Fast filters; paginated large tables; MoM KPI calculation"],
            ["Usability", "Government green theme; en-IN numbers; responsive layout"],
            ["Reliability", "Session survives refresh; graceful API offline notice"],
            ["Security", "JWT cookie; bcrypt; RBAC; login rate limit; audit"],
            ["Maintainability", "TypeScript frontend; schemaRegistry; SQL migrations"],
            ["Scalability", "Server aggregations; large CSV export support"],
        ],
        [3.0, 8.9],
        0.52,
    )

    # ——— 15 Data ———
    s = new_content_slide(prs, "14. Data Requirements & Key Tables (SRS)", 15, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "app_auth: dashboard_users, import_uploads, audit_log",
            "bis_raw: beneficiary / card printing operational tables",
            "dmart_mp: claims, hospitals, patients, treatment, doctor_details_with_registartionandcaseid, icd_data_doctor_details, fraud, m_nafu_safu_source, workflow, LMS",
            "ump_raw: user master",
            "Registry: schemaRegistry.json whitelists importable tables and modules.",
            "Dump: backend/.dump/pmjay.sql includes doctor_details DDL + sample rows.",
        ],
        14,
    )

    # ——— 16 Security ———
    s = new_content_slide(prs, "15. Security Requirements (SRS)", 16, total)
    add_bullets(
        s,
        0.7,
        1.35,
        11.8,
        5.2,
        [
            "SEC-01: Passwords hashed with bcrypt; minimum length on create / reset.",
            "SEC-02: Authenticated API via HTTP-only session cookie (JWT).",
            "SEC-03: Role middleware gates API routes (admin, bis, mp, ump, import).",
            "SEC-04: Login rate limiting / lockout after repeated failures.",
            "SEC-05: Audit logging for auth, admin actions, imports, denied access.",
            "SEC-06: CORS limited to configured frontend origins.",
        ],
        15,
    )

    # ——— 17 Traceability ———
    s = new_content_slide(prs, "16. FRS Traceability (Module → Requirement IDs)", 17, total)
    add_table(
        s,
        0.6,
        1.35,
        12.1,
        [
            ["Module", "Primary FRS IDs"],
            ["Auth / Nav", "AUTH-01..08, NAV-01..06"],
            ["Overview / BIS", "OVR-*, BIS-01..06"],
            ["Claims / Beneficiaries", "MP-CL-*, MP-BN-*"],
            ["Hospitals / Patients / Doctors", "MP-HS-*, MP-PT-*, Doctor / ICD pages"],
            ["Fraud / NAFU-SAFU", "MP-FR-01..06 + NAFU source page"],
            ["Workflow / LMS / UMP", "MP-UW-*, MP-LM-*, UMP-01..04"],
            ["Admin / Import / Export", "ADM-*, IMP-*, FLT-*, INT-*, EXP-*"],
        ],
        [4.8, 7.3],
        0.48,
    )

    # ——— 18 Close ———
    s = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(s, GREEN)
    panel = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.28), Inches(7.5))
    panel.fill.solid()
    panel.fill.fore_color.rgb = GREEN_MID
    panel.line.fill.background()

    add_textbox(s, 1.1, 2.4, 11, 0.6, "End of Document", 32, True, WHITE)
    div = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.1), Inches(3.2), Inches(2.4), Inches(0.06))
    div.fill.solid()
    div.fill.fore_color.rgb = GREEN_MID
    div.line.fill.background()
    add_textbox(s, 1.1, 3.55, 11, 0.45, "SRS + FRS combined in one presentation", 16, False, SOFT)
    add_textbox(s, 1.1, 4.15, 11, 0.4, "PM-JAY Madhya Pradesh Health Analytics Dashboard", 15, False, RGBColor(0xA7, 0xF3, 0xD0))
    add_textbox(s, 1.1, 4.75, 11, 0.35, "Source: SRS.md · ImplementationPlan.md · Live application modules", 12, False, RGBColor(0x86, 0xEF, 0xAC))
    add_footer(s, 18, total)

    import os

    os.makedirs("docs", exist_ok=True)
    out = "docs/PMJAY_MP_Dashboard_SRS_FRS.pptx"
    prs.save(out)
    print("Wrote", out)


if __name__ == "__main__":
    build()
