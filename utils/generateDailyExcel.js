import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import formatNumber from './formatNumber';

export default async function generateDailyExcel(setGeneratingExcel, data, section, user, date) {
  try {
    setGeneratingExcel(true);

    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    const formattedDate = date < 10 ? `0${date}` : date;
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'Daily Consumption Report',
      Subject: `${sectionName} Section Report`,
      Author: 'S&B Nice Nice Food Valley Ltd.',
      CreatedDate: new Date()
    };

    // Prepare data arrays
    const excelData = [];

    // HEADER SECTION
    excelData.push(['S&B Nice Nice Food Valley Ltd.']);
    excelData.push([`${sectionName} Section`]);
    excelData.push([`Daily Consumption Report for ${formattedDate} ${user?.current_period}`]);
    excelData.push([]); // Empty row

    // PRODUCTS SECTION
    excelData.push(['FINISHED PRODUCTS']);
    excelData.push(['No', 'Product Name', 'Carton Weight (kg)', 'Batch', 'Carton', 'Output (kg)']);
    
    // Products Data
    data.products_data?.forEach((product, index) => {
      excelData.push([
        index + 1,
        product.name,
        product.carton_weight,
        product.batch,
        product.carton,
        formatNumber(product.output)
      ]);
    });

    excelData.push([]); // Empty row
    excelData.push([]); // Empty row

    // RAW MATERIALS SECTION
    excelData.push(['RAW MATERIALS']);
    excelData.push(['No', 'Name', 'Opening', 'Received', 'Consumption', 'Stock']);
    
    // Raw Materials Data
    data.rm_data?.forEach((rm, index) => {
      excelData.push([
        index + 1,
        rm.name,
        rm.opening,
        rm.recieved_total,
        formatNumber(rm.consumption_total),
        formatNumber(rm.stock)
      ]);
    });

    excelData.push([]); // Empty row
    excelData.push([]); // Empty row

    // PACKAGING MATERIALS SECTION
    excelData.push(['PACKAGING MATERIALS']);
    excelData.push(['No', 'Name', 'Opening', 'Received', 'Consumption', 'Stock']);
    
    // Packaging Materials Data
    data.pm_data?.forEach((pm, index) => {
      excelData.push([
        index + 1,
        pm.name,
        pm.opening,
        pm.recieved_total,
        formatNumber(pm.consumption_total),
        formatNumber(pm.stock)
      ]);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Apply basic styling through column widths
    const colWidths = [
      { wch: 8 },   // A - No
      { wch: 30 },  // B - Name
      { wch: 15 },  // C - Opening/Carton Weight
      { wch: 15 },  // D - Received/Batch
      { wch: 15 },  // E - Consumption/Carton
      { wch: 15 },  // F - Stock/Output
    ];
    ws['!cols'] = colWidths;

    // Merge header cells
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }); // Company name
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }); // Section name
    ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }); // Date
    ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 5 } }); // Products title
    ws['!merges'].push({ s: { r: 6 + (data.products_data?.length || 0), c: 0 }, e: { r: 6 + (data.products_data?.length || 0), c: 5 } }); // RM title
    ws['!merges'].push({ s: { r: 8 + (data.products_data?.length || 0) + (data.rm_data?.length || 0), c: 0 }, e: { r: 8 + (data.products_data?.length || 0) + (data.rm_data?.length || 0), c: 5 } }); // PM title

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');

    // Generate file and download
    const fileName = `Daily_Report_${sectionName}_${formattedDate}_${user?.current_period}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

  } catch (error) {
    console.error("Error generating Excel:", error);
    alert("Failed to generate Excel file: " + error.message);
  } finally {
    setGeneratingExcel(false);
  }
}