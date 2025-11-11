import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import getInfoUnit from "./getInfoUnit";
import logoBase64 from "./imageData";

export const generateRecipePDF = async (recipeData, section, materialsData, save = true) => {
  try {
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 10;
    const pageWidth = doc.internal.pageSize.getWidth();

    // ====== HEADER (Daily PDF Style) ======
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
    doc.text(`Product Recipe - ${recipeData.name}`, 10, yPosition);
    yPosition += 5;

    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, yPosition);
    yPosition += 15;

    // ====== LOGO (Right side like Daily PDF) ======
    if (logoBase64) {
      const logoWidth = 25;
      const logoHeight = 25;
      const rightWidth = pageWidth * 0.3;
      const logoX = pageWidth - rightWidth + (rightWidth - logoWidth) / 2;
      const logoY = 5;
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);
    }

    // ====== UNIFIED TABLE STYLE (Daily PDF Style) ======
    const borderStyle = {
      lineWidth: { top: 0, right: 0, bottom: 0.3, left: 0 },
      lineColor: [0, 0, 0],
      fillColor: [255, 255, 255], // সাদা ব্যাকগ্রাউন্ড
      textColor: 0,
    };

    // ====== PRODUCT INFORMATION SECTION ======
    if (recipeData.info && Object.keys(recipeData.info).length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PRODUCT INFORMATION", 10, yPosition);
      yPosition += 2;

      const productInfoData = Object.entries(recipeData.info).map(
        ([key, value], index) => {
          const formattedKey = key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
          return [index + 1, formattedKey, `${value} ${getInfoUnit(key)}`];
        }
      );

      autoTable(doc, {
        startY: yPosition,
        head: [["No", "Property", "Value"]],
        body: productInfoData,
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
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 60, halign: "left" },
          2: { cellWidth: 40, halign: "center" },
        },
        margin: { left: 10, right: 10, top: 5 },
      });

      yPosition = doc.lastAutoTable.finalY + 12;
    }

    // Helper function to find material name
    const findMaterialName = (id, list) => {
      const found = list.find((mat) => mat.id === id);
      return found ? found.name || found.id : id;
    };

    // ====== RAW MATERIALS SECTION ======
    if (recipeData.rm && recipeData.rm.length > 0) {
      // Check if need new page
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("RAW MATERIALS", 10, yPosition);
      yPosition += 2;

      const rmTableData = recipeData.rm.map((rmItem, index) => {
        const name = findMaterialName(rmItem.id, materialsData.rm || []);
        const cartonItem = (recipeData.carton_rm || []).find(
          (c) => c.id === rmItem.id
        );
        return [
          index + 1,
          name,
          rmItem.unit || "-",
          rmItem.qty.toString(),
          cartonItem ? cartonItem.qty.toString() : "-",
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [["No", "Material Name", "Unit", "Per Batch Qty", "Per Carton Qty"]],
        body: rmTableData,
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
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 70, halign: "left" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
        },
        margin: { left: 10, right: 10, top: 5 },
      });

      yPosition = doc.lastAutoTable.finalY + 12;
    }

    // ====== PACKAGING MATERIALS SECTION ======
    if (recipeData.pm && recipeData.pm.length > 0) {
      // Check if need new page
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 15;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("PACKAGING MATERIALS", 10, yPosition);
      yPosition += 2;

      const pmTableData = recipeData.pm.map((pmItem, index) => {
        const name = findMaterialName(pmItem.id, materialsData.pm || []);
        const cartonItem = (recipeData.carton_pm || []).find(
          (c) => c.id === pmItem.id
        );
        return [
          index + 1,
          name,
          pmItem.unit || "-",
          pmItem.qty.toString(),
          cartonItem ? cartonItem.qty.toString() : "-",
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [["No", "Material Name", "Unit", "Per Batch Qty", "Per Carton Qty"]],
        body: pmTableData,
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
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 70, halign: "left" },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
        },
        margin: { left: 10, right: 10, top: 5 },
      });
    }

    // ====== FOOTER (Daily PDF Style) ======
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
      const fileName = `[Recipe][${sectionName}] ${recipeData?.name}.pdf`;
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF: " + error.message);
  }
};