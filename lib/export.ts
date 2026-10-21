// 견적서 내보내기 — PDF · 엑셀 (브라우저 전용, 단추를 누를 때만 라이브러리를 불러온다)

export type SheetRow = [label: string, value: string];

const FOOTER = "가상 데이터 · 참고용 견적";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 화면에 숨어 있는 인쇄용 견적서(el)를 그림으로 떠서 A4 PDF 한 장으로 저장
export async function savePdf(el: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.cssText = "display:block;position:fixed;left:-10000px;top:0;width:794px;padding:48px;background:#fff";
  document.body.appendChild(clone);
  try {
    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const width = 210;
    // JPEG로 넣어 파일 크기를 줄인다 (PNG는 수 MB)
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, width, (canvas.height * width) / canvas.width);
    pdf.save(filename);
  } finally {
    clone.remove();
  }
}

export async function saveXlsx(date: string, rows: SheetRow[], filename: string) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("견적서");
  ws.columns = [{ width: 16 }, { width: 52 }];

  ws.addRow(["견적서", date]).font = { bold: true, size: 16 };
  ws.addRow([]);
  for (const r of rows) {
    const row = ws.addRow(r);
    row.getCell(1).font = { bold: true };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1ECE3" } };
    row.eachCell((c) => (c.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }));
  }
  ws.addRow([]);
  ws.addRow([FOOTER]).font = { italic: true, color: { argb: "FF857D72" } };

  const buffer = await wb.xlsx.writeBuffer();
  download(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
}
