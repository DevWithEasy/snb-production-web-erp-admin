import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import formatNumber from './formatNumber';

export async function generateMonthlyPDF(setGeneratingPdf, data, section, user) {
  try {
    setGeneratingPdf(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add company header
    doc.setFontSize(20);
    doc.setTextColor(245, 6, 6);
    doc.text('S&B Nice Nice Food Valley Ltd.', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`${sectionName} Section`, 105, 30, { align: 'center' });
    doc.text(`Monthly Consumption of ${user?.current_period}`, 105, 37, { align: 'center' });

    let yPosition = 50;

    // Summary table
    doc.setFontSize(16);
    doc.text('SUMMARY', 14, yPosition);
    yPosition += 10;

    autoTable(doc, {
      startY: yPosition,
      head: [['Input', 'Output', 'Process Loss', 'Process Loss %']],
      body: [[
        `${data.total_input} Kg`,
        `${data.total_output} Kg`,
        `${data.process_loss} Kg`,
        `${data.loss_percent} %`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Products table
    doc.setFontSize(16);
    doc.text('PRODUCTS', 14, yPosition);
    yPosition += 10;

    const productsBody = data.products_data?.map((product, i) => [
      i + 1,
      product.name,
      formatNumber(product.carton_weight),
      product.total_batch,
      product.total_carton,
      formatNumber(product.total_carton_weight)
    ]) || [];

    autoTable(doc, {
      startY: yPosition,
      head: [['Sl', 'Name', 'Carton Weight', 'Total Batch', 'Total Carton', 'Total Weight']],
      body: productsBody,
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Raw Materials table
    doc.setFontSize(16);
    doc.text('RAW MATERIALS', 14, yPosition);
    yPosition += 10;

    const rmBody = data.rm_data?.map((rm, i) => [
      i + 1,
      rm.name,
      rm.unit,
      rm.opening,
      formatNumber(rm.recieved),
      formatNumber(rm.consumption),
      formatNumber(rm.closing),
      formatNumber(rm.actual_rm_batch_consumption),
      formatNumber(rm.rm_bacth_diff),
      formatNumber(rm.actual_rm_carton_consumption),
      formatNumber(rm.rm_carton_diff)
    ]) || [];

    autoTable(doc, {
      startY: yPosition,
      head: [['Sl', 'Name', 'Unit', 'Opening', 'Received', 'Consumption', 'Closing', 'Batch Consumption', 'Difference', 'Carton Consumption', 'Difference']],
      body: rmBody,
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255] },
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Packaging Materials table
    doc.setFontSize(16);
    doc.text('PACKAGING MATERIALS', 14, yPosition);
    yPosition += 10;

    const pmBody = data.pm_data?.map((pm, i) => [
      i + 1,
      pm.name,
      pm.unit,
      pm.opening,
      formatNumber(pm.recieved),
      formatNumber(pm.consumption),
      formatNumber(pm.closing),
      formatNumber(pm.actual_pm_carton_consumption),
      formatNumber(pm.pm_carton_diff),
      `${formatNumber(pm.loss_percent)}%`
    ]) || [];

    autoTable(doc, {
      startY: yPosition,
      head: [['Sl', 'Name', 'Unit', 'Opening', 'Received', 'Consumption', 'Closing', 'Carton Consumption', 'Difference', 'Process Loss']],
      body: pmBody,
      theme: 'grid',
      headStyles: { fillColor: [0, 122, 255] },
    });

    // Save the PDF
    const fileName = `Monthly_Report_${sectionName}_${user?.current_period}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF: " + error.message);
  } finally {
    setGeneratingPdf(false);
  }
}