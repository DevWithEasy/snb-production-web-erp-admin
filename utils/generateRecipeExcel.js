import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import getInfoUnit from './getInfoUnit';

export const generateRecipeExcel = async (recipeData, section, materialsData) => {
  try {
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'Recipe Details',
      Subject: `${recipeData.name} Recipe`,
      Author: 'S&B Nice Nice Food Valley Ltd.',
      CreatedDate: new Date()
    };

    const excelData = [];

    // ===== HEADER SECTION =====
    excelData.push(['S&B Nice Nice Food Valley Ltd.']);
    excelData.push([`${sectionName} Section`]);
    excelData.push([`Product: ${recipeData.name}`]);
    excelData.push([]);
    let currentRow = excelData.length; // track rows

    // ===== PRODUCT INFORMATION =====
    excelData.push(['PRODUCT INFORMATION']);
    if (recipeData.info && Object.keys(recipeData.info).length > 0) {
      excelData.push(['Property', 'Value']);
      Object.entries(recipeData.info).forEach(([key, value]) => {
        const formattedKey = key
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        excelData.push([formattedKey, `${value} ${getInfoUnit(key)}`]);
      });
    } else {
      excelData.push(['No product information available']);
    }

    excelData.push([]);
    excelData.push([]);
    currentRow = excelData.length;

    // ===== Helper =====
    const findMaterialName = (id, list) => {
      const found = list.find((mat) => mat.id === id);
      return found ? found.name || found.id : id;
    };

    // ===== RAW MATERIALS =====
    const rmTitleRow = excelData.length;
    excelData.push(['RAW MATERIALS']);
    if (recipeData.rm && recipeData.rm.length > 0) {
      excelData.push(['Name', 'Unit', 'Per Batch Qty', 'Per Carton Qty']);
      recipeData.rm.forEach((rmItem) => {
        const name = findMaterialName(rmItem.id, materialsData.rm || []);
        const cartonItem = (recipeData.carton_rm || []).find(c => c.id === rmItem.id);
        excelData.push([
          name,
          rmItem.unit || '-',
          rmItem.qty,
          cartonItem ? cartonItem.qty : '-'
        ]);
      });
    } else {
      excelData.push(['No raw materials data available']);
    }

    excelData.push([]);
    excelData.push([]);

    // ===== PACKAGING MATERIALS =====
    const pmTitleRow = excelData.length;
    excelData.push(['PACKAGING MATERIALS']);
    if (recipeData.pm && recipeData.pm.length > 0) {
      excelData.push(['Name', 'Unit', 'Per Batch Qty', 'Per Carton Qty']);
      recipeData.pm.forEach((pmItem) => {
        const name = findMaterialName(pmItem.id, materialsData.pm || []);
        const cartonItem = (recipeData.carton_pm || []).find(c => c.id === pmItem.id);
        excelData.push([
          name,
          pmItem.unit || '-',
          pmItem.qty,
          cartonItem ? cartonItem.qty : '-'
        ]);
      });
    } else {
      excelData.push(['No packaging materials data available']);
    }

    // ===== Create worksheet =====
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Column widths
    ws['!cols'] = [
      { wch: 35 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];

    // Merge main headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Company
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Section
      { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Product
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // Product Info title
      { s: { r: rmTitleRow, c: 0 }, e: { r: rmTitleRow, c: 3 } }, // RM title
      { s: { r: pmTitleRow, c: 0 }, e: { r: pmTitleRow, c: 3 } }, // PM title
    ];

    // Append to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Recipe Details');

    // Save file
    const fileName = `Recipe_${recipeData.name}_${sectionName}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, fileName);

  } catch (error) {
    console.error('Error generating Excel:', error);
    throw new Error('Failed to generate Excel file: ' + error.message);
  }
};
