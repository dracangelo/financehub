import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { stringify } from 'csv-stringify/sync';
import { format as dateFormat, isValid } from 'date-fns';
import { Report, ReportFormat } from '@/app/actions/reports';
import { saveAs } from 'file-saver';

// Helper function to safely format date
export function safeFormatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return '';
    return dateFormat(date, 'MM/dd/yyyy');
  } catch (error) {
    return '';
  }
}

// Helper function to safely format time
export function safeFormatTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (!isValid(date)) return '';
    return dateFormat(date, 'h:mm a');
  } catch (error) {
    return '';
  }
}

// Helper function to preserve string or return empty string
export function preserveString(str: string | null | undefined): string {
  if (str === null || str === undefined || str.trim() === '') {
    return '';
  }
  return str;
}

// Common function to prepare data for reports
export function prepareReportData(data: any[], reportType: string): any[] {
  if (!data || !data.length) return [];

  switch (reportType) {
    case 'transactions':
      return data.map(item => ({
        id: item.id || '',
        date: safeFormatDate(item.created_at),
        time: safeFormatTime(item.created_at),
        name: preserveString(item.name || item.title),
        category: preserveString(item.category),
        amount: item.amount || 0,
        formatted_amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount || 0),
        account: preserveString(item.account_name || item.account),
        type: preserveString(item.type),
        notes: preserveString(item.notes),
        recurring: item.is_recurring || false,
        tax_deductible: item.tax_deductible || false
      }));

    case 'income-expense':
      return data.map(item => ({
        id: item.id || '',
        date: safeFormatDate(item.created_at),
        name: preserveString(item.name || item.title),
        category: preserveString(item.category),
        type: preserveString(item.type),
        amount: item.amount || 0,
        formatted_amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount || 0),
        // Add comparison data if available
        comparison_amount: item.comparison_total || 0,
        comparison_formatted: item.comparison_formatted_total || '',
        difference: item.total_difference || 0,
        formatted_difference: item.formatted_difference || '',
        percent_change: item.percent_change || '',
        is_increase: item.is_increase || false
      }));
      
    case 'income-sources':
      // Handle income sources report data
      const dataObj = data as any;
      if (dataObj.sources && Array.isArray(dataObj.sources)) {
        // Return the sources array with formatted data
        return dataObj.sources.map((source: any) => ({
          id: source.id || '',
          source: preserveString(source.source),
          amount: source.amount || 0,
          formatted_amount: source.formatted_amount || new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(source.amount || 0),
          percent_of_total: source.percent_of_total || 0,
          formatted_percent: source.formatted_percent || `${(source.percent_of_total || 0).toFixed(1)}%`,
          count: source.count || 0,
          recurring_count: source.recurring_count || 0,
          recurring_percentage: source.recurring_percentage || 0
        }));
      } else if (Array.isArray(data)) {
        // If data is already an array (fallback)
        return data.map(source => ({
          id: source.id || '',
          source: preserveString(source.source || source.name || ''),
          amount: source.amount || 0,
          formatted_amount: source.formatted_amount || new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(source.amount || 0),
          percent_of_total: source.percent_of_total || 0,
          formatted_percent: source.formatted_percent || `${(source.percent_of_total || 0).toFixed(1)}%`,
          count: source.count || 0
        }));
      }
      return [];

    case 'overview':
      return data.map(item => ({
        id: item.id || '',
        date: safeFormatDate(item.created_at),
        name: preserveString(item.name || item.title),
        amount: item.amount || 0,
        formatted_amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount || 0),
        type: preserveString(item.type),
        // Include group data if available
        group_name: item.group_name || '',
        count: item.count || 1,
        total_amount: item.total_amount || item.amount || 0,
        average_amount: item.average_amount || item.amount || 0
      }));

    default:
      return data;
  }
}

// Generate PDF report
export function generatePDFReport(data: any[], reportType: string, title: string): Blob {
  const doc = new jsPDF();
  const preparedData = prepareReportData(data, reportType);
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  doc.setFontSize(12);
  
  // Add date
  const currentDate = dateFormat(new Date(), 'MM/dd/yyyy');
  doc.text(`Generated on: ${currentDate}`, 14, 30);
  
  // Add report data
  let y = 40;
  const pageHeight = doc.internal.pageSize.height;
  
  if (preparedData.length === 0) {
    doc.text('No data available for this report.', 14, y);
  } else {
    // Add headers based on report type
    const headers = getReportHeaders(reportType, data);
    const columnWidths = headers.map(() => 30); // Simple fixed width columns
    
    // Draw header row
    let x = 14;
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      doc.text(header.label, x, y);
      x += columnWidths[index];
    });
    doc.setFont('helvetica', 'normal');
    y += 10;
    
    // Draw data rows
    preparedData.forEach((item) => {
      // Check if we need a new page
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
        
        // Redraw headers on new page
        x = 14;
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, index) => {
          doc.text(header.label, x, y);
          x += columnWidths[index];
        });
        doc.setFont('helvetica', 'normal');
        y += 10;
      }
      
      // Draw row data
      x = 14;
      headers.forEach((header, index) => {
        const value = item[header.key]?.toString() || '';
        doc.text(value.substring(0, 25), x, y); // Limit text length
        x += columnWidths[index];
      });
      y += 7;
    });
    
    // Add summary if available (for grouped data)
    if (data[0]?.group_key) {
      doc.addPage();
      y = 20;
      doc.setFontSize(16);
      doc.text('Summary', 14, y);
      doc.setFontSize(12);
      y += 15;
      
      // Summary headers
      const summaryHeaders = [
        { label: 'Group', key: 'group_name' },
        { label: 'Count', key: 'count' },
        { label: 'Total', key: 'formatted_total' }
      ];
      
      // Add comparison header if available
      if (data[0]?.comparison_total !== undefined) {
        summaryHeaders.push(
          { label: 'Previous', key: 'comparison_formatted_total' },
          { label: 'Change', key: 'percent_change' }
        );
      }
      
      const summaryWidths = summaryHeaders.map(() => 30); // Simple fixed width columns
      
      // Draw summary header
      x = 14;
      doc.setFont('helvetica', 'bold');
      summaryHeaders.forEach((header, index) => {
        doc.text(header.label, x, y);
        x += summaryWidths[index];
      });
      doc.setFont('helvetica', 'normal');
      y += 10;
      
      // Draw summary data
      data.forEach((group) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
          
          // Redraw headers on new page
          x = 14;
          doc.setFont('helvetica', 'bold');
          summaryHeaders.forEach((header, index) => {
            doc.text(header.label, x, y);
            x += summaryWidths[index];
          });
          doc.setFont('helvetica', 'normal');
          y += 10;
        }
        
        x = 14;
        summaryHeaders.forEach((header, index) => {
          const value = group[header.key]?.toString() || '';
          doc.text(value.substring(0, 25), x, y);
          x += summaryWidths[index];
        });
        y += 7;
      });
    }
  }
  
  return doc.output('blob');
}

// Generate CSV report
export function generateCSVReport(data: any[], reportType: string): Blob {
  const preparedData = prepareReportData(data, reportType);
  
  let csvContent: string;
  
  if (preparedData.length === 0) {
    csvContent = 'No data available for this report.';
  } else {
    // Convert to CSV
    csvContent = stringify(preparedData, {
      header: true,
      columns: getReportHeaders(reportType, data).map(h => ({ key: h.key, header: h.label }))
    });
    
    // Add summary data for grouped reports
    if (data[0]?.group_key) {
      csvContent += '\n\nSUMMARY\n';
      
      const summaryHeaders = ['Group', 'Count', 'Total', 'Average'];
      
      // Add comparison headers if available
      if (data[0]?.comparison_total !== undefined) {
        summaryHeaders.push('Previous Period', 'Difference', 'Change %');
      }
      
      csvContent += summaryHeaders.join(',') + '\n';
      
      // Add summary rows
      data.forEach(group => {
        let row = [
          `"${group.group_name || ''}"`,
          group.count || 0,
          `"${group.formatted_total || ''}"`,
          `"${group.formatted_average || ''}"`
        ];
        
        if (group.comparison_total !== undefined) {
          row.push(
            `"${group.comparison_formatted_total || ''}"`,
            `"${group.formatted_difference || ''}"`,
            `"${group.percent_change || ''}"`
          );
        }
        
        csvContent += row.join(',') + '\n';
      });
    }
  }
  
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

// Generate Excel report
export function generateExcelReport(data: any[], reportType: string, title: string): Blob {
  const preparedData = prepareReportData(data, reportType);
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  if (preparedData.length === 0) {
    // Create empty worksheet with message
    const ws = XLSX.utils.aoa_to_sheet([['No data available for this report.']]);
    XLSX.utils.book_append_sheet(wb, ws, title);
  } else {
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(preparedData);
    
    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, title);
    
    // Add summary sheet for grouped data
    if (data[0]?.group_key) {
      const summaryData = data.map(group => ({
        Group: group.group_name || '',
        Count: group.count || 0,
        Total: group.formatted_total || '',
        Average: group.formatted_average || '',
        ...(group.comparison_total !== undefined ? {
          'Previous Period': group.comparison_formatted_total || '',
          'Difference': group.formatted_difference || '',
          'Change %': group.percent_change || ''
        } : {})
      }));
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    }
  }
  
  // Generate blob
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Generate report based on format
export function generateReportByFormat(data: any[], report: Report): Blob {
  switch (report.format) {
    case 'pdf':
      return generatePDFReport(data, report.type, report.title);
    case 'csv':
      return generateCSVReport(data, report.type);
    case 'excel':
      return generateExcelReport(data, report.type, report.title);
    default:
      throw new Error(`Unsupported format: ${report.format}`);
  }
}

// Download the generated report
export function downloadReport(blob: Blob, filename: string) {
  saveAs(blob, filename);
}

// Get headers for each report type
function getReportHeaders(reportType: string, data?: any[]): Array<{ key: string, label: string }> {
  switch (reportType) {
    case 'transactions':
      return [
        { key: 'date', label: 'Date' },
        { key: 'name', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'formatted_amount', label: 'Amount' },
        { key: 'account', label: 'Account' },
        { key: 'type', label: 'Type' },
        { key: 'recurring', label: 'Recurring' },
        { key: 'tax_deductible', label: 'Tax Deductible' }
      ];

    case 'income-expense':
      const incomeExpenseHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'name', label: 'Description' },
        { key: 'category', label: 'Category' },
        { key: 'type', label: 'Type' },
        { key: 'formatted_amount', label: 'Amount' }
      ];
      
      return incomeExpenseHeaders;
      
    case 'income-sources':
      return [
        { key: 'source', label: 'Income Source' },
        { key: 'formatted_amount', label: 'Amount' },
        { key: 'formatted_percent', label: 'Percent of Total' },
        { key: 'count', label: 'Number of Entries' },
        { key: 'recurring_count', label: 'Recurring Entries' },
        { key: 'recurring_percentage', label: 'Recurring %' }
      ];

    case 'overview':
      const overviewHeaders = [
        { key: 'date', label: 'Date' },
        { key: 'name', label: 'Description' },
        { key: 'type', label: 'Type' },
        { key: 'formatted_amount', label: 'Amount' }
      ];
      
      return overviewHeaders;

    default:
      // Dynamic headers based on data structure
      if (!data || !data.length) return [];
      const firstItem = data[0] || {};
      return Object.keys(firstItem).map(key => ({
        key, 
        label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }));
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
