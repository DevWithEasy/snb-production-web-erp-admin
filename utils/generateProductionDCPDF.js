import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import LOGO_BASE64 from "./imageData";

export async function generateProductionDCPDF(
  setGeneratingPdf,
  data,
  section,
  user,
  startDate,
  endDate,
  save = false
) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    const formattedStartDate = startDate < 10 ? `0${startDate}` : startDate;
    const formattedEndDate = endDate < 10 ? `0${endDate}` : endDate;

    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    // ====== HEADER ======
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(245, 6, 6);
    doc.text("S&B Nice Nice Food Valley Ltd.", 10, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`${sectionName} Section`, 10, yPosition);
    yPosition += 5;

    doc.setFontSize(10);
    doc.text(
      `Production Delivery Chalan - ${formattedStartDate} to ${formattedEndDate} ${user?.current_period}`,
      10,
      yPosition
    );
    yPosition += 5;

    doc.setFontSize(9);
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

    // ====== SUMMARY SECTION ======
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("SUMMARY", 10, yPosition);
    yPosition += 2;

    const summaryData = [
      ["Total Batch", data.summary.batch || 0],
      ["Total Carton", data.summary.carton || 0],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [["Item", "Quantity"]],
      body: summaryData,
      headStyles: {
        fillColor: [0, 122, 255],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        lineWidth: { top: 0, right: 0, bottom: 0.3, left: 0 },
        lineColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        textColor: 0,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 40, halign: "left" },
        1: { cellWidth: 30, halign: "center" },
      },
      margin: { left: 10, right: 10, top: 5 },
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // ====== PRODUCTS DETAILS SECTION ======
    if (data.recipes_data && data.recipes_data.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PRODUCT DETAILS", 10, yPosition);
      yPosition += 2;

      const productsTableData = data.recipes_data
        .filter(
          (product) =>
            (product.total_batch || 0) !== 0 ||
            (product.total_carton || 0) !== 0
        )
        .map((product, index) => [
          index + 1,
          product.name || "N/A",
          product.total_batch || 0,
          product.total_carton || 0,
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["No", "Product Name", "Total Batch", "Total Carton"]],
        body: productsTableData,
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          lineWidth: { top: 0, right: 0, bottom: 0.3, left: 0 },
          lineColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          textColor: 0,
        },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 100, halign: "left" },
          2: { cellWidth: 30, halign: "center" },
          3: { cellWidth: 30, halign: "center" },
        },
        margin: { left: 10, right: 10, top: 5 },
      });
    }

    // ====== FOOTER ======
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`S&B Production ERP`, 10, 290);
      doc.text("Developed by: Robi App Lab", 105, 290, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: "right" });
    }

    // ====== OUTPUT OPTIONS ======
    if (!save) {
      // Open PDF in browser (user will manually save)
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      // Memory cleanup
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 30000);
    } else {
      // Direct download
      const fileName = `Production_DC_${sectionName}_${formattedStartDate}-${formattedEndDate}_${user?.current_period}.pdf`;
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPdf(false);
  }
}
