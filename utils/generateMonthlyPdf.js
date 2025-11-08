import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import formatNumber from "./formatNumber";
import LOGO_BASE64 from "./imageData";

export async function generateMonthlyPDF(
  setGeneratingPdf,
  data,
  section,
  user
) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    const doc = new jsPDF();
    let yPosition = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    // ====== HEADER ======
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 6, 6);
    doc.text("S&B Nice Nice Food Valley Ltd.", 10, yPosition);
    yPosition += 6;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`${sectionName} Section`, 10, yPosition);
    yPosition += 5;

    doc.setFontSize(11);
    doc.text(`Monthly Consumption - ${user?.current_period}`, 10, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, yPosition);
    yPosition += 15;

    // ====== LOGO ======
    if (LOGO_BASE64) {
      const logoWidth = 25;
      const logoHeight = 25;
      const rightWidth = pageWidth * 0.3;
      const logoX = pageWidth - rightWidth + (rightWidth - logoWidth) / 2;
      const logoY = 5;
      doc.addImage(LOGO_BASE64, "PNG", logoX, logoY, logoWidth, logoHeight);
    }

    // ====== CHECK EMPTY ======
    const hasProducts = data.products_data?.some(
      (p) => p.total_batch && p.total_carton
    );
    const hasRm = data.rm_data?.length > 0;
    const hasPm = data.pm_data?.length > 0;
    const allSectionsEmpty = !hasProducts && !hasRm && !hasPm;

    if (allSectionsEmpty) {
      const boxWidth = 150;
      const boxHeight = 60;
      const boxX = (pageWidth - boxWidth) / 2;
      const boxY = yPosition;

      doc.setDrawColor(150, 150, 150);
      doc.setFillColor(250, 250, 250);
      doc.rect(boxX, boxY, boxWidth, boxHeight, "FD");

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(102, 102, 102);
      doc.text("No Data Available", 105, boxY + 15, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(136, 136, 136);
      const messageLines = [
        "No production or consumption data was recorded",
        "for the selected month.",
        " ",
        "Please check if:",
        "• Batch production was done",
        "• Carton production was completed",
        "• Materials were received or consumed",
      ];
      messageLines.forEach((line, i) =>
        doc.text(line, 105, boxY + 25 + i * 4, { align: "center" })
      );
    } else {
      // ====== COMMON STYLE (Bottom Border Only + White Background) ======
      const borderStyle = {
        lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 },
        lineColor: { bottom: [0, 0, 0] },
        fillColor: [255, 255, 255],
        textColor: 0,
      };

      // ====== SUMMARY ======
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("SUMMARY", 10, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [["Input", "Output", "Process Loss", "Process Loss %"]],
        body: [
          [
            `${data.total_input || "0"} Kg`,
            `${data.total_output || "0"} Kg`,
            `${data.process_loss || "0"} Kg`,
            `${data.loss_percent || "0"} %`,
          ],
        ],
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: borderStyle,
        alternateRowStyles: { fillColor: [255, 255, 255] }, // সব row সাদা
        styles: {
          fontSize: 7,
          cellPadding: 3,
          halign: "center",
          ...borderStyle,
        },
        margin: { left: 10, right: 15, top: 5 },
      });

      yPosition = doc.lastAutoTable.finalY + 12;

      // ====== FINISHED PRODUCTS ======
      const filteredProducts =
        data.products_data?.filter((p) => p.total_batch || p.total_carton) ||
        [];
      if (filteredProducts.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.text("FINISHED PRODUCTS", 10, yPosition);
        yPosition += 5;

        const productsTableData = filteredProducts.map((p, i) => [
          i + 1,
          p.name || "N/A",
          formatNumber(p.carton_weight) || "0",
          p.total_batch || "0",
          p.total_carton || "0",
          formatNumber(p.total_carton_weight) || "0",
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [
            [
              "No",
              "Product Name",
              "Carton Weight",
              "Total Batch",
              "Total Carton",
              "Total Weight",
            ],
          ],
          body: productsTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          bodyStyles: borderStyle,
          alternateRowStyles: { fillColor: [255, 255, 255] },
          styles: { fontSize: 7, cellPadding: 2, ...borderStyle },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 65, halign: "left" },
            2: { cellWidth: 25, halign: "center" },
            3: { cellWidth: 22, halign: "center" },
            4: { cellWidth: 22, halign: "center" },
            5: { cellWidth: 25, halign: "center" },
          },
          margin: { left: 10, right: 15, top: 5 },
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // ====== RAW MATERIALS ======
      if (data.rm_data?.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.text("RAW MATERIALS", 10, yPosition);
        yPosition += 5;

        const rmTableData = data.rm_data.map((rm, i) => [
          i + 1,
          rm.name,
          rm.unit,
          formatNumber(rm.opening),
          formatNumber(rm.recieved),
          formatNumber(rm.consumption),
          formatNumber(rm.closing),
          formatNumber(rm.actual_rm_batch_consumption),
          formatNumber(rm.rm_bacth_diff),
          formatNumber(rm.actual_rm_carton_consumption),
          formatNumber(rm.rm_carton_diff),
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [
            [
              "No",
              "Material Name",
              "Unit",
              "Opening",
              "Received",
              "Consumption",
              "Closing",
              "Batch Cons.",
              "Diff.",
              "Carton Cons.",
              "Diff.",
            ],
          ],
          body: rmTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          bodyStyles: borderStyle,
          alternateRowStyles: { fillColor: [255, 255, 255] },
          styles: { fontSize:7, cellPadding: 1.5, ...borderStyle },
          margin: { left: 10, right: 15, top: 5 },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 60, halign: "left" },
            2: { cellWidth: 10, halign: "center" },
            3: { halign: "center" },
            4: { halign: "center" },
            5: { halign: "center" },
            6: { halign: "left" },
            7: { halign: "center" },
            8: { halign: "center" },
            9: { halign: "center" },
            10: { halign: "center" },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // ====== PACKAGING MATERIALS ======
      if (data.pm_data?.length > 0) {
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.text("PACKAGING MATERIALS", 10, yPosition);
        yPosition += 5;

        const pmTableData = data.pm_data.map((pm, i) => [
          i + 1,
          pm.name,
          pm.unit,
          formatNumber(pm.opening),
          formatNumber(pm.recieved),
          formatNumber(pm.consumption),
          formatNumber(pm.closing),
          formatNumber(pm.actual_pm_carton_consumption),
          formatNumber(pm.pm_carton_diff),
          `${formatNumber(pm.loss_percent)}%`,
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [
            [
              "No",
              "Material Name",
              "Unit",
              "Opening",
              "Received",
              "Consumption",
              "Closing",
              "Carton Cons.",
              "Diff.",
              "Process Loss",
            ],
          ],
          body: pmTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          bodyStyles: borderStyle,
          alternateRowStyles: { fillColor: [255, 255, 255] },
          styles: { fontSize: 7, cellPadding: 2, ...borderStyle },
          margin: { left: 10, right: 15, top: 5 },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 60, halign: "left" },
            2: { cellWidth: 10, halign: "center" },
            3: { halign: "center" },
            4: { halign: "center" },
            5: { halign: "center" },
            6: { halign: "left" },
            7: { halign: "center" },
            8: { halign: "center" },
            9: { halign: "center" },
          },
        });
      }
    }

    // ====== FOOTER ======
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`S&B Production ERP`, 10, 290);
      doc.text("Developed by: Robi App Lab", 105, 290, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: "right" });
    }

    // ====== SAVE PDF ======
    const fileName = `Monthly_Report_${sectionName}_${user?.current_period}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPdf(false);
  }
}
