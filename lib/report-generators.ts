import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';
import { Report, ReportFormat } from '@/app/actions/reports';
import { saveAs } from 'file-saver';

// Common function to prepare data for reports
export function prepareReportData(data: any[], reportType: string) {
  // Format and structure data based on report type
  switch (reportType) {
    case 'overview':
      return data.map(item => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString(),
        description: item.description || '',
        amount: item.amount || 0,
        category: item.category || '',
        type: item.type || '',
      }));
    
    case 'income-expense':
      return data.map(item => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString(),
        description: item.description || '',
        amount: item.amount || 0,
        category: item.category || '',
        type: item.type || '',
      }));
    
    case 'net-worth':
      return data.map(item => ({
        id: item.id,
        name: item.name || '',
        value: item.value || 0,
        type: item.type || '',
        category: item.category || '',
        date: new Date(item.updated_at || item.created_at).toLocaleDateString(),
      }));
    
    case 'investments':
      return data.map(item => ({
        id: item.id,
        name: item.name || '',
        symbol: item.symbol || '',
        shares: item.shares || 0,
        price: item.price || 0,
        value: item.value || 0,
        date: new Date(item.updated_at || item.created_at).toLocaleDateString(),
      }));
    
    default:
      return data;
  }
}

// Generate PDF report
export function generatePdfReport(data: any[], report: Report): Blob {
  const formattedData = prepareReportData(data, report.type);
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(report.title, 14, 20);
  
  // Add description if available
  if (report.description) {
    doc.setFontSize(12);
    doc.text(report.description, 14, 30);
  }
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);
  
  // Add time range
  doc.text(`Time Range: ${formatTimeRange(report.time_range)}`, 14, 45);
  
  // Create table headers based on report type
  let headers: string[] = [];
  let startY = 55;
  
  switch (report.type) {
    case 'overview':
      headers = ['Date', 'Description', 'Amount', 'Category', 'Type'];
      break;
    case 'income-expense':
      headers = ['Date', 'Description', 'Amount', 'Category', 'Type'];
      break;
    case 'net-worth':
      headers = ['Name', 'Value', 'Type', 'Category', 'Last Updated'];
      break;
    case 'investments':
      headers = ['Name', 'Symbol', 'Shares', 'Price', 'Value', 'Last Updated'];
      break;
  }
  
  // Draw table
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Table headers
  let xOffset = 14;
  headers.forEach(header => {
    doc.text(header, xOffset, startY);
    xOffset += 35;
  });
  
  // Table data
  startY += 10;
  formattedData.forEach((row, index) => {
    if (startY > 270) {
      // Add new page if we're near the bottom
      doc.addPage();
      startY = 20;
      
      // Redraw headers on new page
      xOffset = 14;
      headers.forEach(header => {
        doc.text(header, xOffset, startY);
        xOffset += 35;
      });
      startY += 10;
    }
    
    xOffset = 14;
    Object.values(row).slice(1).forEach((value: any) => {
      doc.text(String(value), xOffset, startY);
      xOffset += 35;
    });
    
    startY += 7;
  });
  
  return doc.output('blob');
}

// Generate CSV report
export function generateCsvReport(data: any[], report: Report): Blob {
  const formattedData = prepareReportData(data, report.type);
  
  // Convert data to CSV
  const csvContent = stringify(formattedData, {
    header: true,
    columns: getColumnsForReportType(report.type),
  });
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
}

// Generate Excel report
export function generateExcelReport(data: any[], report: Report): Blob {
  const formattedData = prepareReportData(data, report.type);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(formattedData);
  
  // Add worksheet to workbook - limit sheet name to 31 characters (Excel limitation)
  const sheetName = report.title.length > 30 ? report.title.substring(0, 30) : report.title;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Generate report based on format
export function generateReportByFormat(data: any[], report: Report): Blob {
  switch (report.format) {
    case 'pdf':
      return generatePdfReport(data, report);
    case 'csv':
      return generateCsvReport(data, report);
    case 'excel':
      return generateExcelReport(data, report);
    default:
      throw new Error(`Unsupported format: ${report.format}`);
  }
}

// Download the generated report
export function downloadReport(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

// Helper functions
function getColumnsForReportType(reportType: string) {
  switch (reportType) {
    case 'overview':
    case 'income-expense':
      return ['date', 'description', 'amount', 'category', 'type'];
    case 'net-worth':
      return ['name', 'value', 'type', 'category', 'date'];
    case 'investments':
      return ['name', 'symbol', 'shares', 'price', 'value', 'date'];
    default:
      return [];
  }
}

function formatTimeRange(timeRange: string): string {
  switch (timeRange) {
    case '7d':
      return 'Last 7 Days';
    case '30d':
      return 'Last 30 Days';
    case '90d':
      return 'Last 90 Days';
    case '1y':
      return 'Last Year';
    case 'ytd':
      return 'Year to Date';
    case 'all':
      return 'All Time';
    default:
      return timeRange;
  }
}
