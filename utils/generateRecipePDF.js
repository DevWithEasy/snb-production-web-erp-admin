import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import getInfoUnit from './getInfoUnit';
import logoBase64 from './imageData';

export const generateRecipePDF = async (recipeData, section, materialsData) => {
  try {
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Create new PDF document
    const doc = new jsPDF();
    let yPosition = 20;

    // Add logo and header
    if (logoBase64) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoWidth = 30;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPosition, 30, 30);
      yPosition += 40;
    }

    // Company name
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 6, 6);
    doc.text('S&B Nice Nice Food Valley Ltd.', 105, yPosition, { align: 'center' });
    yPosition += 10;

    // Section info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Section: ${sectionName}`, 105, yPosition, { align: 'center' });
    yPosition += 8;

    // Product name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Product: ${recipeData.name}`, 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Product Information Section
    if (recipeData.info && Object.keys(recipeData.info).length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCT INFORMATION', 14, yPosition);
      yPosition += 10;

      const productInfoData = Object.entries(recipeData.info).map(([key, value], index) => {
        const formattedKey = key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        return [formattedKey, `${value} ${getInfoUnit(key)}`];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Property', 'Value']],
        body: productInfoData,
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 70, halign: 'left' },
          1: { cellWidth: 50, halign: 'left' }
        },
        margin: { top: 5 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Helper function to find material name
    const findMaterialName = (id, list) => {
      const found = list.find((mat) => mat.id === id);
      return found ? found.name || found.id : id;
    };

    // Raw Materials Section
    if (recipeData.rm && recipeData.rm.length > 0) {
      // Check if need new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RAW MATERIALS', 14, yPosition);
      yPosition += 10;

      const rmTableData = recipeData.rm.map((rmItem) => {
        const name = findMaterialName(rmItem.id, materialsData.rm || []);
        const cartonItem = (recipeData.carton_rm || []).find(c => c.id === rmItem.id);
        return [
          name,
          rmItem.unit || '-',
          rmItem.qty.toString(),
          cartonItem ? cartonItem.qty.toString() : '-'
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Name', 'Unit', 'Per Batch Qty', 'Per Carton Qty']],
        body: rmTableData,
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { top: 5 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Packaging Materials Section
    if (recipeData.pm && recipeData.pm.length > 0) {
      // Check if need new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PACKAGING MATERIALS', 14, yPosition);
      yPosition += 10;

      const pmTableData = recipeData.pm.map((pmItem) => {
        const name = findMaterialName(pmItem.id, materialsData.pm || []);
        const cartonItem = (recipeData.carton_pm || []).find(c => c.id === pmItem.id);
        return [
          name,
          pmItem.unit || '-',
          pmItem.qty.toString(),
          cartonItem ? cartonItem.qty.toString() : '-'
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Name', 'Unit', 'Per Batch Qty', 'Per Carton Qty']],
        body: pmTableData,
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 80, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { top: 5 }
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 285);
      doc.text('Developed by: Robi App Lab', 105, 285, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
    }

    // Save PDF
    const fileName = `Recipe_${recipeData.name}_${sectionName}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF: " + error.message);
  }
};