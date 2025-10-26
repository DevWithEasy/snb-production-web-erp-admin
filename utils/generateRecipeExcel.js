import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import getInfoUnit from './getInfoUnit';

export const generateRecipeExcel = async (recipeData, section, materialsData) => {
  try {
    const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: 'Recipe Details',
      Subject: `${recipeData.name} Recipe`,
      Author: 'S&B Nice Nice Food Valley Ltd.',
      CreatedDate: new Date()
    };

    // Prepare data arrays
    const excelData = [];

    // HEADER SECTION
    excelData.push(['S&B Nice Nice Food Valley Ltd.']);
    excelData.push([`${sectionName} Section`]);
    excelData.push([`Product: ${recipeData.name}`]);
    excelData.push([]); // Empty row

    // PRODUCT INFORMATION SECTION
    excelData.push(['PRODUCT INFORMATION']);
    if (recipeData.info && Object.keys(recipeData.info).length > 0) {
      excelData.push(['Property', 'Value']);
      Object.entries(recipeData.info).forEach(([key, value]) => {
        const formattedKey = key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        excelData.push([formattedKey, `${value} ${getInfoUnit(key)}`]);
      });
    } else {
      excelData.push(['No product information available']);
    }

    excelData.push([]); // Empty row
    excelData.push([]); // Empty row

    // Helper function to find material name
    const findMaterialName = (id, list) => {
      const found = list.find((mat) => mat.id === id);
      return found ? found.name || found.id : id;
    };

    // RAW MATERIALS SECTION
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

    excelData.push([]); // Empty row
    excelData.push([]); // Empty row

    // PACKAGING MATERIALS SECTION
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

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Apply column widths
    const colWidths = [
      { wch: 35 }, // Name/Property
      { wch: 20 }, // Unit/Value
      { wch: 15 }, // Per Batch Qty
      { wch: 15 }, // Per Carton Qty
    ];
    ws['!cols'] = colWidths;

    // Merge header cells
    if (!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }); // Company name
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }); // Section name
    ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }); // Product name
    ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }); // Product Info title
    
    // Calculate positions for other sections
    const productInfoRows = recipeData.info ? Object.keys(recipeData.info).length + 2 : 2;
    const rmTitleRow = 5 + productInfoRows + 2;
    const rmRows = recipeData.rm ? recipeData.rm.length + 1 : 1;
    const pmTitleRow = rmTitleRow + rmRows + 2;

    ws['!merges'].push({ s: { r: rmTitleRow, c: 0 }, e: { r: rmTitleRow, c: 3 } }); // RM title
    ws['!merges'].push({ s: { r: pmTitleRow, c: 0 }, e: { r: pmTitleRow, c: 3 } }); // PM title

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Recipe Details');

    // Generate file and download
    const fileName = `Recipe_${recipeData.name}_${sectionName}.xlsx`;
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Save file
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);

  } catch (error) {
    console.error("Error generating Excel:", error);
    throw new Error("Failed to generate Excel file: " + error.message);
  }
};