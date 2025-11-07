import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatNumber from './formatNumber';
import LOGO_BASE64 from './imageData';

export async function generateMonthlyPDF(setGeneratingPdf, data, section, user) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);

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
    doc.text(`Monthly Consumption - ${user?.current_period}`, 10, yPosition);
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

    // Check if data is empty
    const hasProducts = data.products_data?.some(product => 
      product.total_batch !== 0 && product.total_carton !== 0
    );
    const hasRm = data.rm_data && data.rm_data.length > 0;
    const hasPm = data.pm_data && data.pm_data.length > 0;
    
    const allSectionsEmpty = !hasProducts && !hasRm && !hasPm;

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
        'for the selected month.',
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
      // Summary Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0); // Black color
      doc.text('SUMMARY', 10, yPosition);
      yPosition += 5;

      autoTable(doc, {
        startY: yPosition,
        head: [['Input', 'Output', 'Process Loss', 'Process Loss %']],
        body: [[
          `${data.total_input || '0'} Kg`,
          `${data.total_output || '0'} Kg`,
          `${data.process_loss || '0'} Kg`,
          `${data.loss_percent || '0'} %`
        ]],
        headStyles: {
          fillColor: [0, 122, 255],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          textColor: 0, // Black color for body text
          fontStyle: 'normal', // Normal font for body
          fillColor: [255, 255, 255] // White background
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255] // No alternate color for single row
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        },
        margin: { left: 10, right: 10, top: 5 },
        tableWidth: 'auto'
      });

      yPosition = doc.lastAutoTable.finalY + 12;

      // Products Section
      const filteredProducts = data.products_data?.filter(product => 
        product.total_batch !== 0 && product.total_carton !== 0
      ) || [];

      if (filteredProducts.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('FINISHED PRODUCTS', 10, yPosition);
        yPosition += 5;

        const productsTableData = filteredProducts.map((product, index) => [
          index + 1,
          product.name || 'N/A',
          formatNumber(product.carton_weight) || '0',
          product.total_batch || '0',
          product.total_carton || '0',
          formatNumber(product.total_carton_weight) || '0'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Product Name', 'Carton Weight', 'Total Batch', 'Total Carton', 'Total Weight']],
          body: productsTableData,
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
          alternateRowStyles: {
            fillColor: [248, 248, 248] // Light gray for striped effect
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, 
            1: { cellWidth: 70, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' }, 
            3: { cellWidth: 25, halign: 'center' }, 
            4: { cellWidth: 25, halign: 'center' },  
            5: { cellWidth: 25, halign: 'center' }   
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // Raw Materials Section
      if (data.rm_data && data.rm_data.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('RAW MATERIALS', 10, yPosition);
        yPosition += 5;

        const rmTableData = data.rm_data.map((rm, index) => [
          index + 1,
          rm.name || 'N/A',
          rm.unit || 'N/A',
          formatNumber(rm.opening) || '0',
          formatNumber(rm.recieved) || '0',
          formatNumber(rm.consumption) || '0',
          formatNumber(rm.closing) || '0',
          formatNumber(rm.actual_rm_batch_consumption) || '0',
          formatNumber(rm.rm_bacth_diff) || '0',
          formatNumber(rm.actual_rm_carton_consumption) || '0',
          formatNumber(rm.rm_carton_diff) || '0'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Material Name', 'Unit', 'Opening', 'Received', 'Consumption', 'Closing', 'Batch Cons.', 'Diff.', 'Carton Cons.', 'Diff.']],
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
          alternateRowStyles: {
            fillColor: [248, 248, 248] // Light gray for striped effect
          },
          styles: {
            fontSize: 6,
            cellPadding: 1.5,
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, 
            1: { cellWidth: 45, halign: 'left' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 18, halign: 'center' }, 
            4: { cellWidth: 18, halign: 'center' }, 
            5: { cellWidth: 20, halign: 'center' },  
            6: { cellWidth: 18, halign: 'center' },
            7: { cellWidth: 18, halign: 'center' },
            8: { cellWidth: 15, halign: 'center' },
            9: { cellWidth: 18, halign: 'center' },
            10: { cellWidth: 15, halign: 'center' }
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });

        yPosition = doc.lastAutoTable.finalY + 12;
      }

      // Packaging Materials Section
      if (data.pm_data && data.pm_data.length > 0) {
        // Check if need new page
        if (yPosition > 260) {
          doc.addPage();
          yPosition = 15;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0); // Black color
        doc.text('PACKAGING MATERIALS', 10, yPosition);
        yPosition += 5;

        const pmTableData = data.pm_data.map((pm, index) => [
          index + 1,
          pm.name || 'N/A',
          pm.unit || 'N/A',
          formatNumber(pm.opening) || '0',
          formatNumber(pm.recieved) || '0',
          formatNumber(pm.consumption) || '0',
          formatNumber(pm.closing) || '0',
          formatNumber(pm.actual_pm_carton_consumption) || '0',
          formatNumber(pm.pm_carton_diff) || '0',
          `${formatNumber(pm.loss_percent) || '0'}%`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['No', 'Material Name', 'Unit', 'Opening', 'Received', 'Consumption', 'Closing', 'Carton Cons.', 'Diff.', 'Process Loss']],
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
          alternateRowStyles: {
            fillColor: [248, 248, 248] // Light gray for striped effect
          },
          styles: {
            fontSize: 7,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },  
            1: { cellWidth: 50, halign: 'left' },
            2: { cellWidth: 15, halign: 'center' },  
            3: { cellWidth: 18, halign: 'center' }, 
            4: { cellWidth: 18, halign: 'center' },  
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 18, halign: 'center' },
            7: { cellWidth: 20, halign: 'center' },
            8: { cellWidth: 15, halign: 'center' },
            9: { cellWidth: 18, halign: 'center' }
          },
          margin: { left: 10, right: 10, top: 5 },
          tableWidth: 'auto'
        });
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`S&B Production ERP`, 10, 290);
      doc.text('Developed by: Robi App Lab', 105, 290, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' });
    }

    // Save PDF
    const fileName = `Monthly_Report_${sectionName}_${user?.current_period}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    setGeneratingPdf(false);
  }
}