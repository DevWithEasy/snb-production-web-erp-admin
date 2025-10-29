import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatNumber from './formatNumber';
import LOGO_BASE64 from './imageData';

export async function generateDailyPDF(setGeneratingPdf, data, section, user, date) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    const formattedDate = date < 10 ? `0${date}` : date;

    // Filter out zero data
    const filteredProducts = (data.products_data || []).filter(product => 
      (product.batch && Number(product.batch) > 0) || 
      (product.carton && Number(product.carton) > 0)
    );

    const filteredRm = (data.rm_data || []).filter(rm => 
      (rm.recieved_total && Number(rm.recieved_total) > 0) || 
      (rm.consumption_total && Number(rm.consumption_total) > 0)
    );

    const filteredPm = (data.pm_data || []).filter(pm => 
      (pm.recieved_total && Number(pm.recieved_total) > 0) || 
      (pm.consumption_total && Number(pm.consumption_total) > 0)
    );

    // Check if all sections are empty
    const allSectionsEmpty = filteredProducts.length === 0 && filteredRm.length === 0 && filteredPm.length === 0;

    // Create new PDF document with reduced margins
    const doc = new jsPDF();
    let yPosition = 10; 

    // Flex layout for header - Left side text, Right side image
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Left side - Text content
    const leftWidth = pageWidth * 0.7; // 70% for text
    const rightWidth = pageWidth * 0.3; // 30% for image
    
    // Company name - Left aligned
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 6, 6);
    doc.text('S&B Nice Nice Food Valley Ltd.', 10, yPosition);
    yPosition += 6;

    // Section info - Left aligned
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Black color
    doc.text(`${sectionName} Section`, 10, yPosition);
    yPosition += 5;

    // Date info - Left aligned
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0); // Black color
    doc.text(`Daily Consumption - ${formattedDate} ${user?.current_period}`, 10, yPosition);
    yPosition += 5;

    // Generated date - Left aligned
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, yPosition);
    yPosition += 15;

    // Right side - Logo image (centered within right section)
    if (LOGO_BASE64) {
      const logoWidth = 25;
      const logoHeight = 25;
      const logoX = pageWidth - rightWidth + (rightWidth - logoWidth) / 2; // Center in right section
      const logoY = 5; // Align with top text
      doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }

    if (allSectionsEmpty) {
      // Show beautiful empty state with border
      const boxWidth = 150;
      const boxHeight = 60;
      const boxX = (pageWidth - boxWidth) / 2;
      const boxY = yPosition;

      // Draw border with rounded corners (simulated)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(boxX, boxY, boxWidth, boxHeight);

      // Add background color
      doc.setFillColor(250, 250, 250);
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');

      // Draw border again on top of background
      doc.setDrawColor(150, 150, 150);
      doc.rect(boxX, boxY, boxWidth, boxHeight);

      // Main message
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 102, 102);
      doc.text('No Data Available', 105, boxY + 15, { align: 'center' });

      // Sub message
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(136, 136, 136);
      
      const messageLines = [
        'No production or consumption data was recorded',
        'for the selected date.',
        ' ',
        'Please check if:',
        '• Batch production was done',
        '• Carton production was completed', 
        '• Materials were received or consumed'
      ];

      messageLines.forEach((line, index) => {
        doc.text(line, 105, boxY + 25 + (index * 4), { align: 'center' });
      });

    } else {
      // Products Section
      if (filteredProducts.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('FINISHED PRODUCTS', 10, yPosition);
        yPosition += 5;

        const productsTableData = filteredProducts.map((product, index) => [
          index + 1,
          product.name || 'N/A',
          product.carton_weight || '0',
          product.batch || '0',
          product.carton || '0',
          formatNumber(product.output) || '0'
        ]);

        // autoTable function with reduced margins and centered header text
        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Product Name', 'Carton Weight', 'Batch', 'Carton', 'Output (kg)']],
          body: productsTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center' // Header text center aligned
          },
          bodyStyles: {
            textColor: 0, // Black color for body text
            fontStyle: 'normal' // Normal font for body
          },
          styles: {
            fontSize: 9, 
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, 
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' }, 
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }   
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });

        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Raw Materials Section
      if (filteredRm.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('RAW MATERIALS', 10, yPosition);
        yPosition += 5;

        const rmTableData = filteredRm.map((rm, index) => [
          index + 1,
          rm.name || 'N/A',
          rm.opening || '0',
          rm.recieved_total || '0',
          formatNumber(rm.consumption_total) || '0',
          formatNumber(rm.stock) || '0'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Material Name', 'Opening', 'Received', 'Consumption', 'Stock']],
          body: rmTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            textColor: 0, // Black color for body text
            fontStyle: 'normal' // Normal font for body
          },
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, 
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' }, 
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }  
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });

        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Packaging Materials Section
      if (filteredPm.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('PACKAGING MATERIALS', 10, yPosition);
        yPosition += 5;

        const pmTableData = filteredPm.map((pm, index) => [
          index + 1,
          pm.name || 'N/A',
          pm.opening || '0',
          pm.recieved_total || '0',
          formatNumber(pm.consumption_total) || '0',
          formatNumber(pm.stock) || '0'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Material Name', 'Opening', 'Received', 'Consumption', 'Stock']],
          body: pmTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            textColor: 0, // Black color for body text
            fontStyle: 'normal' // Normal font for body
          },
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },  
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' },  
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }   
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });
      }
    }

    // Footer position adjust করা হয়েছে
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`S&B Production ERP`, 10, 290);
      // doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 290);
      doc.text('Developed by: Robi App Lab', 105, 290, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' });
    }

    // Save PDF
    const fileName = `Daily_Report_${sectionName}_${formattedDate}_${user?.current_period}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPdf(false);
  }
}



/*
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatNumber from './formatNumber';
import LOGO_BASE64 from './imageData';

export async function generateDailyPDF(setGeneratingPdf, data, section, user, date) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    const formattedDate = date < 10 ? `0${date}` : date;

    // Filter out zero data
    const filteredProducts = (data.products_data || []).filter(product => 
      (product.batch && Number(product.batch) > 0) || 
      (product.carton && Number(product.carton) > 0)
    );

    const filteredRm = (data.rm_data || []).filter(rm => 
      (rm.recieved_total && Number(rm.recieved_total) > 0) || 
      (rm.consumption_total && Number(rm.consumption_total) > 0)
    );

    const filteredPm = (data.pm_data || []).filter(pm => 
      (pm.recieved_total && Number(pm.recieved_total) > 0) || 
      (pm.consumption_total && Number(pm.consumption_total) > 0)
    );

    // Check if all sections are empty
    const allSectionsEmpty = filteredProducts.length === 0 && filteredRm.length === 0 && filteredPm.length === 0;

    // Create new PDF document with reduced margins
    const doc = new jsPDF();
    let yPosition = 5; 

    // Add logo and header - 20x20 pixels, centered
    if (LOGO_BASE64) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoWidth = 20;
      const logoX = (pageWidth - logoWidth) / 2; // Center calculation
      doc.addImage(LOGO_BASE64, 'PNG', logoX, yPosition, 20, 20); 
      yPosition += 25;
    }

    // Company name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 6, 6);
    doc.text('S&B Nice Nice Food Valley Ltd.', 105, yPosition, { align: 'center' });
    yPosition += 8;

    // Section info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${sectionName} Section`, 105, yPosition, { align: 'center' });
    yPosition += 6;

    // Date info
    doc.setFontSize(12);
    doc.setFont('helvetica');
    doc.text(`Daily Consumption - ${formattedDate} ${user?.current_period}`, 105, yPosition, { align: 'center' });
    yPosition += 15;

    if (allSectionsEmpty) {
      // Show beautiful empty state with border
      const pageWidth = doc.internal.pageSize.getWidth();
      const boxWidth = 150;
      const boxHeight = 60;
      const boxX = (pageWidth - boxWidth) / 2;
      const boxY = yPosition;

      // Draw border with rounded corners (simulated)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.rect(boxX, boxY, boxWidth, boxHeight);

      // Add background color
      doc.setFillColor(250, 250, 250);
      doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');

      // Draw border again on top of background
      doc.setDrawColor(150, 150, 150);
      doc.rect(boxX, boxY, boxWidth, boxHeight);

      // Main message
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(102, 102, 102);
      doc.text('No Data Available', 105, boxY + 15, { align: 'center' });

      // Sub message
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(136, 136, 136);
      
      const messageLines = [
        'No production or consumption data was recorded',
        'for the selected date.',
        ' ',
        'Please check if:',
        '• Batch production was done',
        '• Carton production was completed', 
        '• Materials were received or consumed'
      ];

      messageLines.forEach((line, index) => {
        doc.text(line, 105, boxY + 25 + (index * 4), { align: 'center' });
      });

    } else {
      // Products Section
      if (filteredProducts.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('FINISHED PRODUCTS', 10, yPosition);
        yPosition += 5;

        const productsTableData = filteredProducts.map((product, index) => [
          index + 1,
          product.name || 'N/A',
          product.carton_weight || '0',
          product.batch || '0',
          product.carton || '0',
          formatNumber(product.output) || '0'
        ]);

        // autoTable function with reduced margins and centered header text
        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Product Name', 'Carton Weight', 'Batch', 'Carton', 'Output (kg)']],
          body: productsTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center' // Header text center aligned
          },
          styles: {
            fontSize: 9, 
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, 
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' }, 
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }   
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });

        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Raw Materials Section
      if (filteredRm.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('RAW MATERIALS', 10, yPosition);
        yPosition += 5;

        const rmTableData = filteredRm.map((rm, index) => [
          index + 1,
          rm.name || 'N/A',
          rm.opening || '0',
          rm.recieved_total || '0',
          formatNumber(rm.consumption_total) || '0',
          formatNumber(rm.stock) || '0'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Material Name', 'Opening', 'Received', 'Consumption', 'Stock']],
          body: rmTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center' // Header text center aligned
          },
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, 
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' }, 
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }  
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });

        yPosition = doc.lastAutoTable.finalY + 8;
      }

      // Packaging Materials Section
      if (filteredPm.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PACKAGING MATERIALS', 10, yPosition);
        yPosition += 5;

        const pmTableData = filteredPm.map((pm, index) => [
          index + 1,
          pm.name || 'N/A',
          pm.opening || '0',
          pm.recieved_total || '0',
          formatNumber(pm.consumption_total) || '0',
          formatNumber(pm.stock) || '0'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Material Name', 'Opening', 'Received', 'Consumption', 'Stock']],
          body: pmTableData,
          headStyles: {
            fillColor: [0, 122, 255],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center' // Header text center aligned
          },
          styles: {
            fontSize: 9,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },  
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' },  
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }   
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });
      }
    }

    // Footer position adjust করা হয়েছে
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 290);
      doc.text('Developed by: Robi App Lab', 105, 290, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' });
    }

    // Save PDF
    const fileName = `Daily_Report_${sectionName}_${formattedDate}_${user?.current_period}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPdf(false);
  }
}
*/