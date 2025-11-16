import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import formatNumber from "./formatNumber";
import LOGO_BASE64 from "./imageData";

export async function generateMonthlyPDF(
  setGeneratingPdf,
  data,
  section,
  user,
  save = true
) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    let yPosition = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

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

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
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
      // ... existing empty state code ...
    } else {
      // ====== COMMON STYLE ======
      const borderStyle = {
        lineWidth: { top: 0, right: 0, bottom: 0.2, left: 0 },
        lineColor: { bottom: [0, 0, 0] },
        fillColor: [255, 255, 255],
        textColor: 0,
      };

      // ====== SUMMARY ======
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("SUMMARY", 10, yPosition);
      yPosition += 3;

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
        alternateRowStyles: { fillColor: [255, 255, 255] },
        styles: {
          fontSize: 7,
          cellPadding: 2,
          halign: "center",
          ...borderStyle,
        },
        columnStyles: {
            0: { cellWidth: 30, halign: "center" },
            1: { cellWidth: 30, halign: "center" },
            2: { cellWidth: 30, halign: "center" },
            3: { cellWidth: 30, halign: "center" },
          },
        margin: { left: 10, right: 15, top: 5 },
      });

      yPosition = doc.lastAutoTable.finalY + 12;

      // ====== FINANCIAL SUMMARY ======
      if (data.lossGain) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text("FINANCIAL SUMMARY", 10, yPosition);
        yPosition += 3;

        const financialData = [
          [
            "Raw Material Batch Difference",
            formatNumber(data.lossGain.rm_batch_diff_price_value),
          ],
          [
            "Raw Material Carton Difference",
            formatNumber(data.lossGain.rm_carton_diff_price_value),
          ],
          [
            "Packaging Material Carton Difference",
            formatNumber(data.lossGain.pm_carton_diff_price_value),
          ],
          [
            {
              content: "Batch-Carton Total Difference",
              styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
            },
            {
              content: formatNumber(
                data.lossGain.bacth_carton_diff_total_value
              ),
              styles: {
                fontStyle: "bold",
                fillColor: [240, 240, 240],
                halign: "right",
              },
            },
          ],
          [
            {
              content: "Carton-Carton Total Difference",
              styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
            },
            {
              content: formatNumber(data.lossGain.carton_diff_total_value),
              styles: {
                fontStyle: "bold",
                fillColor: [240, 240, 240],
                halign: "right",
              },
            },
          ],
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [["Description", "Amount (TK)"]],
          body: financialData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          bodyStyles: borderStyle,
          alternateRowStyles: { fillColor: [255, 255, 255] },
          styles: {
            fontSize: 7,
            cellPadding: 2,
            ...borderStyle,
          },
          columnStyles: {
            0: { cellWidth: 100, halign: "left" },
            1: { cellWidth: 50, halign: "right" },
          },
          margin: { left: 10, right: 15, top: 5 },
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // ====== FINISHED PRODUCTS ======
      const filteredProducts =
        data.products_data?.filter((p) => p.total_batch || p.total_carton) ||
        [];
      if (filteredProducts.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(9);
        doc.text("FINISHED PRODUCTS", 10, yPosition);
        yPosition += 3;

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
            0: { cellWidth: 15, halign: "center" },
            1: { cellWidth: 80, halign: "left" },
            2: { cellWidth: 30, halign: "center" },
            3: { cellWidth: 25, halign: "center" },
            4: { cellWidth: 25, halign: "center" },
            5: { cellWidth: 30, halign: "center" },
          },
          margin: { left: 10, right: 15, top: 5 },
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // ====== RAW MATERIALS ======
      if (data.rm_data?.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.text("RAW MATERIALS", 10, yPosition);
        yPosition += 3;

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
          formatNumber(rm.rm_bacth_diff_value),
          formatNumber(rm.actual_rm_carton_consumption),
          formatNumber(rm.rm_carton_diff),
          formatNumber(rm.rm_carton_diff_value),
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
              "Diff. Value",
              "Carton Cons.",
              "Diff.",
              "Diff. Value",
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
          styles: { fontSize: 7, cellPadding: 2, ...borderStyle },
          margin: { left: 10, right: 15, top: 5 },
          columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 60, halign: "left" },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 20, halign: "center" },
            5: { cellWidth: 20, halign: "center" },
            6: { cellWidth: 20, halign: "center" },
            7: { cellWidth: 20, halign: "center" },
            8: { cellWidth: 18, halign: "center" },
            9: { cellWidth: 20, halign: "center" },
            10: { cellWidth: 20, halign: "center" },
            11: { cellWidth: 18, halign: "center" },
            12: { cellWidth: 20, halign: "center" },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // ====== PACKAGING MATERIALS ======
      if (data.pm_data?.length > 0) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.text("PACKAGING MATERIALS", 10, yPosition);
        yPosition += 5;

        const pmTableData = data.pm_data.map((pm, i) => {
          const status = pm.status ? "Y" : "N";
          return [
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
            formatNumber(pm.lgQty),
            formatNumber(pm.lgValue),
            status,
          ];
        });

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
              "L.G Qty",
              "L.G Value",
              "Status",
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
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 60, halign: "left" },
            2: { cellWidth: 15, halign: "center" },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 20, halign: "center" },
            5: { cellWidth: 20, halign: "center" },
            6: { cellWidth: 20, halign: "center" },
            7: { cellWidth: 20, halign: "center" },
            8: { cellWidth: 18, halign: "center" },
            9: { cellWidth: 20, halign: "center" },
            10: { cellWidth: 20, halign: "center" },
            11: { cellWidth: 20, halign: "center" },
            12: { cellWidth: 20, halign: "center" },
          },
        });

        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // ====== PROCESS LOSS PERCENTAGE INFORMATION ======
      const percents = {
        rm: "0%",
        carton: "0.2%",
        wrapper: "2%",
        pouch: "0.5%",
        tray: "0.2%",
        atc: "0.2%",
        jar: "0.2%",
        gum_tape: "0%",
        poly: "0.5%",
        paper: "0.5%",
        alloy_paper: "2%",
        board: "0.2%",
        sticker: "0.2%",
        print: "100%",
      };

      // Add process loss information as paragraph
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PROCESS LOSS PERCENTAGE INFORMATION", 10, yPosition);
      yPosition += 6;

      // Create paragraph text from percents object
      const processLossText = Object.entries(percents)
        .map(([key, value]) => {
          const materialName =
            key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
          return `${materialName} - ${value}`;
        })
        .join(", ");

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      // Split long text into multiple lines
      const maxWidth = pageWidth - 20; // 10mm margin on both sides
      const splitText = doc.splitTextToSize(processLossText, maxWidth);

      doc.text(splitText, 10, yPosition);
      yPosition += splitText.length * 4 + 8;

      // ====== SIGNATURE SECTION - SIMPLIFIED AND GUARANTEED ======
      // Always add signature after all content
      addSignatureSection(doc, yPosition);
    }

    // ====== SIGNATURE SECTION WITH NOTE SPACE ======
    function addSignatureSection(doc, startY) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Check if we need a new page for signatures
      if (startY > pageHeight - 60) {
        // Increased margin for note space
        console.log("Adding new page for signature");
        doc.addPage();
        startY = 10;
      }

      const noteY = startY + 5;
      const signatureY = startY + 35;
      const lineLength = 50;
      const gapBetweenLines = 60;
      const totalSignatureWidth = lineLength * 3 + gapBetweenLines * 2;
      const startX = (pageWidth - totalSignatureWidth) / 2;

      // ====== NOTE SPACE ======
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);

      // Note box (approximately 3 lines high)
      const noteBoxWidth = totalSignatureWidth;
      const noteBoxHeight = 16;
      const noteBoxX = startX;

      // Draw note box
      doc.rect(noteBoxX, noteY, noteBoxWidth, noteBoxHeight);

      // Add "Note" hint text
      doc.setFontSize(6);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150, 150, 150); // Gray color for hint
      doc.text("Note", noteBoxX + 3, noteY + 3);

      // ====== SIGNATURE LINES ======
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);

      // Section Incharge (Left)
      const sectionInchargeX = startX;
      doc.line(
        sectionInchargeX,
        signatureY,
        sectionInchargeX + lineLength,
        signatureY
      );
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0); // Reset to black
      doc.text(
        "Section Incharge",
        sectionInchargeX + lineLength / 2,
        signatureY + 4,
        { align: "center" }
      );

      // Head Of Department (Center)
      const headDeptX = startX + lineLength + gapBetweenLines;
      doc.line(headDeptX, signatureY, headDeptX + lineLength, signatureY);
      doc.text(
        "Head Of Department",
        headDeptX + lineLength / 2,
        signatureY + 4,
        { align: "center" }
      );

      // Factory Manager (Right)
      const factoryManagerX = startX + lineLength * 2 + gapBetweenLines * 2;
      doc.line(
        factoryManagerX,
        signatureY,
        factoryManagerX + lineLength,
        signatureY
      );
      doc.text(
        "Factory Manager",
        factoryManagerX + lineLength / 2,
        signatureY + 4,
        { align: "center" }
      );
    }

    // ====== FOOTER ======
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      doc.text(`S&B Production ERP`, 10, pageHeight - 10);
      doc.text("Developed by: Robi App Lab", pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 10, pageHeight - 10, {
        align: "right",
      });
    }

    // ====== OUTPUT OPTIONS ======
    if (!save) {
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");

      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 30000);
    } else {
      const fileName = `Monthly_Report_${sectionName}_${user?.current_period}.pdf`;
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPdf(false);
  }
}
