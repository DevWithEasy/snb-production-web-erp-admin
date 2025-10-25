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

    // Calculate row indices for merging
    const productsTitleRow = 4;
    const rmTitleRow = productsTitleRow + 1 + (data.products_data?.length || 0) + 2; // +1 for header, +2 for empty rows
    const pmTitleRow = rmTitleRow + 1 + (data.rm_data?.length || 0) + 2; // +1 for header, +2 for empty rows

    // Merge header cells
    if (!ws['!merges']) ws['!merges'] = [];
    
    // Company name, section name, and date - merge across all columns
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 5 } });
    ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
    
    // Section titles - merge across all columns
    ws['!merges'].push({ s: { r: productsTitleRow, c: 0 }, e: { r: productsTitleRow, c: 5 } });
    ws['!merges'].push({ s: { r: rmTitleRow, c: 0 }, e: { r: rmTitleRow, c: 5 } });
    ws['!merges'].push({ s: { r: pmTitleRow, c: 0 }, e: { r: pmTitleRow, c: 5 } });

    // Apply cell styling for alignment
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        
        if (!ws[cell_ref]) continue;
        
        // Initialize cell style if it doesn't exist
        if (!ws[cell_ref].s) {
          ws[cell_ref].s = {};
        }
        
        // Headers (row 0, 1, 2, and section titles) - center aligned
        if (R === 0 || R === 1 || R === 2 || R === productsTitleRow || R === rmTitleRow || R === pmTitleRow) {
          ws[cell_ref].s = {
            ...ws[cell_ref].s,
            alignment: { horizontal: 'center', vertical: 'center' },
            font: { bold: true }
          };
        } 
        // Column headers (row after section titles) - center aligned
        else if (R === productsTitleRow + 1 || R === rmTitleRow + 1 || R === pmTitleRow + 1) {
          ws[cell_ref].s = {
            ...ws[cell_ref].s,
            alignment: { horizontal: 'center', vertical: 'center' },
            font: { bold: true }
          };
        }
        // Data rows - right aligned for numeric columns, left aligned for text columns
        else {
          if (C === 0 || C === 2 || C === 3 || C === 4 || C === 5) { // No, numeric columns
            ws[cell_ref].s = {
              ...ws[cell_ref].s,
              alignment: { horizontal: 'right', vertical: 'center' }
            };
          } else { // Name column
            ws[cell_ref].s = {
              ...ws[cell_ref].s,
              alignment: { horizontal: 'left', vertical: 'center' }
            };
          }
        }
      }
    }

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