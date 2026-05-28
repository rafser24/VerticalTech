"""
convertir_a_pdf.py
──────────────────
Convierte documento_tecnico_st_ventas.html → documento_tecnico_st_ventas.pdf

Requisitos (instalar una sola vez):
    pip install weasyprint

Uso:
    python convertir_a_pdf.py
"""

import sys
import os

HTML_FILE = os.path.join(os.path.dirname(__file__), "documento_tecnico_st_ventas.html")
PDF_FILE  = os.path.join(os.path.dirname(__file__), "documento_tecnico_st_ventas.pdf")

def main():
    try:
        from weasyprint import HTML, CSS
    except ImportError:
        print("❌  WeasyPrint no está instalado.")
        print("    Ejecuta:  pip install weasyprint")
        sys.exit(1)

    if not os.path.exists(HTML_FILE):
        print(f"❌  No se encontró el archivo: {HTML_FILE}")
        sys.exit(1)

    print("📄  Convirtiendo HTML a PDF ...")

    # CSS extra para optimizar la impresión
    print_css = CSS(string="""
        @page {
            size: A4;
            margin: 15mm 18mm;
        }
        body {
            background: white !important;
        }
        .page-wrap {
            max-width: 100% !important;
            padding: 0 !important;
        }
        .cover {
            border-radius: 0 !important;
        }
        pre {
            white-space: pre-wrap !important;
            word-break: break-all;
        }
        section {
            page-break-inside: avoid;
        }
    """)

    HTML(filename=HTML_FILE).write_pdf(PDF_FILE, stylesheets=[print_css])

    size_kb = os.path.getsize(PDF_FILE) // 1024
    print(f"✅  PDF generado: {PDF_FILE}")
    print(f"    Tamaño: {size_kb} KB")

if __name__ == "__main__":
    main()
