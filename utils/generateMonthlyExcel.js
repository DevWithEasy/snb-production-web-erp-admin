import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import formatNumber from './formatNumber';

export default async function generateMonthlyExcel(setGeneratingExcel, data, section, user) {
  try {
    setGeneratingExcel(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws_data = [];

    // Header section
    ws_data.push(['S&B Nice Nice Food Valley Ltd.']);
    ws_data.push([`${sectionName} Section`]);
    ws_data.push([`Monthly Consumption of ${user?.current_period}`]);
    ws_data.push([]);

    // Summary section
    ws_data.push(['SUMMARY']);
    ws_data.push(['Input', 'Output', 'Process Loss', 'Process Loss %']);
    ws_data.push([
      `${data.total_input} Kg`,
      `${data.total_output} Kg`,
      `${data.process_loss} Kg`,
      `${data.loss_percent} %`
    ]);
    ws_data.push([]);

    // Products section
    ws_data.push(['PRODUCTS']);
    ws_data.push(['Sl', 'Name', 'Carton Weight', 'Total Batch', 'Total Carton', 'Total Weight']);
    data.products_data?.forEach((product, i) => {
      ws_data.push([
        i + 1,
        product.name,
        formatNumber(product.carton_weight),
        product.total_batch,
        product.total_carton,
        formatNumber(product.total_carton_weight)
      ]);
    });
    ws_data.push([]);

    // Raw Materials section
    ws_data.push(['RAW MATERIALS']);
    ws_data.push([
      'Sl', 'Name', 'Unit', 'Opening', 'Received', 'Consumption', 
      'Closing', 'Batch Consumption', 'Difference', 'Carton Consumption', 'Difference'
    ]);
    data.rm_data?.forEach((rm, i) => {
      ws_data.push([
        i + 1,
        rm.name,
        rm.unit,
        rm.opening,
        rm.recieved,
        formatNumber(rm.consumption),
        formatNumber(rm.closing),
        formatNumber(rm.actual_rm_batch_consumption),
        formatNumber(rm.rm_bacth_diff),
        formatNumber(rm.actual_rm_carton_consumption),
        formatNumber(rm.rm_carton_diff)
      ]);
    });
    ws_data.push([]);

    // Packaging Materials section
    ws_data.push(['PACKAGING MATERIALS']);
    ws_data.push([
      'Sl', 'Name', 'Unit', 'Opening', 'Received', 'Consumption', 
      'Closing', 'Carton Consumption', 'Difference', 'Process Loss'
    ]);
    data.pm_data?.forEach((pm, i) => {
      ws_data.push([
        i + 1,
        pm.name,
        pm.unit,
        pm.opening,
        pm.recieved,
        formatNumber(pm.consumption),
        formatNumber(pm.closing),
        formatNumber(pm.actual_pm_carton_consumption),
        formatNumber(pm.pm_carton_diff),
        `${formatNumber(pm.loss_percent)}%`
      ]);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Set column widths
    const colWidths = [
      { wch: 8 },   // Sl
      { wch: 20 },  // Name
      { wch: 12 },  // Unit
      { wch: 12 },  // Opening
      { wch: 12 },  // Received
      { wch: 15 },  // Consumption
      { wch: 12 },  // Closing
      { wch: 18 },  // Batch Consumption
      { wch: 15 },  // Difference
      { wch: 18 },  // Carton Consumption
      { wch: 15 }   // Difference
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');

    // Generate file and trigger download
    const fileName = `Monthly_Report_${sectionName}_${user?.current_period}.xlsx`;
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error("Error generating Excel:", error);
    alert("Failed to generate Excel file: " + error.message);
  } finally {
    setGeneratingExcel(false);
  }
}