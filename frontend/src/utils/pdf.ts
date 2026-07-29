/**
 * Genera un PDF con la matriz de asignación diaria (obras × operarios).
 * Modo oscuro, estilo moderno, tabla centrada horizontalmente.
 * Compacto: cabe en una hoja A4 (o A3 si hay muchos datos).
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Obra, Operario } from "../types";

interface PdfParams {
  fecha: string;
  obras: Obra[];
  operarios: Operario[];
  isAssigned: (obraId: number, operarioId: number) => boolean;
}

const PAGE_MARGIN = 8;
const OBRA_COL = 38;

// Paleta modo oscuro
const COLORS = {
  bg: [15, 23, 42] as [number, number, number],
  header: [30, 41, 59] as [number, number, number],
  rowAlt: [22, 33, 50] as [number, number, number],
  border: [51, 65, 85] as [number, number, number],
  text: [241, 245, 249] as [number, number, number],
  textMuted: [148, 163, 184] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  assigned: [34, 197, 94] as [number, number, number],
  assignedAlt: [22, 163, 74] as [number, number, number],
};

export function generateDailyAssignmentPDF({
  fecha,
  obras,
  operarios,
  isAssigned,
}: PdfParams): void {
  const rowsHeight = (obras.length + 1) * 8 + 32;
  const needsA3 = rowsHeight > 190;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: needsA3 ? "a3" : "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const sideMargin = PAGE_MARGIN;

  // ── Calcular ancho de columna de operario para llenar la página ─────
  // Reserva OBRA_COL para la primera columna, reparte el resto entre las
  // columnas de operarios para que la tabla ocupe TODO el ancho
  // disponible entre los márgenes laterales.
  const opColWidth = (pageWidth - sideMargin * 2 - OBRA_COL) / operarios.length;

  // ── Fondo de la página ──────────────────────────────────────────────
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // ── Cabecera ──────────────────────────────────────────────────────────
  const headerHeight = needsA3 ? 22 : 20;
  doc.setFillColor(...COLORS.header);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Línea de acento verde
  doc.setFillColor(...COLORS.assigned);
  doc.rect(0, headerHeight, pageWidth, 0.8, "F");

  doc.setTextColor(...COLORS.headerText);
  doc.setFontSize(needsA3 ? 16 : 14);
  doc.setFont("helvetica", "bold");
  doc.text("Asignación Diaria", sideMargin, headerHeight * 0.55);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const fechaFmt = new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(fechaFmt, pageWidth - sideMargin, headerHeight * 0.55, {
    align: "right",
  });

  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(
    `${obras.length} obras · ${operarios.length} operarios · ${new Date().toLocaleString("es-ES")}`,
    sideMargin,
    headerHeight * 0.85,
  );

  doc.setTextColor(...COLORS.text);

  // ── Tabla ────────────────────────────────────────────────────────────
  const startY = headerHeight + 4;

  const head = [
    [
      { content: "Obra", styles: { halign: "left", valign: "middle" } },
      ...operarios.map((op) => ({
        content: abreviarNombre(op.nombre, 10),
      })),
    ],
  ];

  const body = obras.map((o) => [
    { content: `${o.id}. ${truncate(o.nombre, 30)}` },
    ...operarios.map((op) => ({
      content: "",
      _assigned: isAssigned(o.id, op.id),
    })),
  ]);

  // Estilo para cada columna de operario (ancho calculado para llenar la hoja)
  const colStyles: Record<number, { cellWidth: number; halign: "left" | "center" }> = {
    0: { cellWidth: OBRA_COL, halign: "left" },
  };
  for (let i = 1; i <= operarios.length; i++) {
    colStyles[i] = { cellWidth: opColWidth, halign: "center" };
  }

  autoTable(doc, {
    startY,
    margin: { left: sideMargin, right: sideMargin, bottom: 12 },
    head: head as any,
    body: body as any,
    theme: "plain",
    styles: {
      cellPadding: { top: 1.5, right: 1, bottom: 1.5, left: 1.5 },
      fontSize: 6,
      lineColor: COLORS.border,
      lineWidth: 0.1,
      font: "helvetica",
      minCellHeight: 5,
      textColor: COLORS.text,
    },
    headStyles: {
      fillColor: COLORS.header,
      textColor: COLORS.headerText,
      fontStyle: "bold",
      fontSize: 6,
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      valign: "middle",
      fillColor: COLORS.bg,
    },
    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },
    columnStyles: colStyles,
    didParseCell: (data) => {
      if (
        data.section === "body" &&
        data.column.index > 0 &&
        (data.cell.raw as any)?._assigned === true
      ) {
        const isAltRow = (data.row.index ?? 0) % 2 === 1;
        data.cell.styles.fillColor = isAltRow ? COLORS.assignedAlt : COLORS.assigned;
        data.cell.styles.textColor = COLORS.assigned;
        data.cell.styles.fontStyle = "normal";
        data.cell.styles.halign = "center";
        data.cell.styles.valign = "middle";
      }
    },
    didDrawPage: (data) => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.textMuted);
      doc.text(
        `Página ${data.pageNumber} / ${page}`,
        pageWidth - sideMargin,
        pageHeight - 4,
        { align: "right" },
      );
      doc.text("ProApp · Asignación Diaria", sideMargin, pageHeight - 4);
      doc.setTextColor(...COLORS.text);
    },
  });

  doc.save(`asignacion-${fecha}.pdf`);
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function abreviarNombre(s: string, max: number): string {
  const parts = s.split(/[\s.]+/).filter(Boolean);
  if (parts.length <= 1) return truncate(s, max);
  const ap = parts[parts.length - 1];
  const nom = parts
    .slice(0, -1)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join(". ");
  const abrev = `${nom}. ${ap}`.trim();
  return truncate(abrev.length < s.length ? abrev : s, max);
}