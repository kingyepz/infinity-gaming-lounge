/**
 * Report Generator Utility for Infinity Gaming Lounge
 * Handles generation of various data reports in different formats
 */

import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { storage } from './storage';
import { Response } from 'express';
import fs from 'fs';
import path from 'path';

// Report type definitions
export type ReportType = 'revenue' | 'usage' | 'games' | 'customers' | 'inventory' | 'financial';
export type ReportFormat = 'csv' | 'pdf' | 'excel';

export interface ReportOptions {
  type: ReportType;
  format: ReportFormat;
  startDate?: Date;
  endDate?: Date;
  stationId?: number;
  gameId?: number;
  userId?: number;
}

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

/**
 * Generate report based on type and format
 * @param options Report generation options
 * @param res Express response object for streaming the file
 */
export async function generateReport(options: ReportOptions, res: Response): Promise<void> {
  try {
    // Get report data based on type
    const data = await getReportData(options);
    
    // Generate file in specified format
    switch (options.format) {
      case 'csv':
        return generateCSV(data, options.type, res);
      case 'excel':
        return generateExcel(data, options.type, res);
      case 'pdf':
        return generatePDF(data, options.type, res);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
}

/**
 * Get report data based on report type
 */
async function getReportData(options: ReportOptions): Promise<any[]> {
  const { type, startDate, endDate } = options;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
  const end = endDate || new Date();
  
  try {
    switch (type) {
      case 'revenue': {
        const transactions = await storage.getTransactions();
        return transactions
          .filter(tx => {
            const txDate = tx.createdAt ? new Date(tx.createdAt) : null;
            return txDate && txDate >= start && txDate <= end && tx.paymentStatus === 'completed';
          })
          .map(tx => ({
            transactionId: tx.id,
            date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A',
            time: tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString() : 'N/A',
            customer: tx.customerName,
            station: tx.stationId,
            game: tx.gameName || 'N/A',
            sessionType: tx.sessionType,
            amount: tx.amount,
            paymentMethod: 'N/A', // TODO: Get payment method from payments table
            duration: tx.duration || 'N/A'
          }));
      }
      
      case 'usage': {
        const stations = await storage.getGameStations();
        const transactions = await storage.getTransactions();
        
        // Group transactions by station
        const stationUsage = stations.map(station => {
          const stationTransactions = transactions.filter(tx => 
            tx.stationId === station.id && 
            tx.createdAt && 
            new Date(tx.createdAt) >= start && 
            new Date(tx.createdAt) <= end
          );
          
          const totalHours = stationTransactions.reduce((sum, tx) => 
            sum + (tx.duration || 0) / 60, 0);
          
          const revenue = stationTransactions
            .filter(tx => tx.paymentStatus === 'completed')
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            
          return {
            stationId: station.id,
            stationName: station.name,
            totalSessions: stationTransactions.length,
            totalHours: totalHours.toFixed(2),
            revenue: revenue.toFixed(2),
            hourlyRate: station.hourlyRate || 'N/A',
            lastUsed: stationTransactions.length > 0 
              ? new Date(Math.max(...stationTransactions
                .filter(tx => tx.createdAt)
                .map(tx => new Date(tx.createdAt!).getTime()))).toLocaleString()
              : 'Never used'
          };
        });
        
        return stationUsage;
      }
      
      case 'games': {
        const games = await storage.getGames();
        const transactions = await storage.getTransactions();
        
        return games.map(game => {
          const gameTransactions = transactions.filter(tx => 
            tx.gameName === game.name && 
            tx.createdAt && 
            new Date(tx.createdAt) >= start && 
            new Date(tx.createdAt) <= end
          );
          
          const totalRevenue = gameTransactions
            .filter(tx => tx.paymentStatus === 'completed')
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            
          const avgDuration = gameTransactions.length > 0
            ? gameTransactions.reduce((sum, tx) => sum + (tx.duration || 0), 0) / gameTransactions.length / 60
            : 0;
            
          return {
            gameId: game.id,
            gameName: game.name,
            category: game.description || 'N/A',
            totalSessions: gameTransactions.length,
            averageSessionHours: avgDuration.toFixed(2),
            totalRevenue: totalRevenue.toFixed(2),
            pricePerGame: game.pricePerSession || 'N/A'
          };
        });
      }
      
      case 'customers': {
        const customers = await storage.getCustomers();
        const transactions = await storage.getTransactions();
        
        return customers.map(customer => {
          const customerTransactions = transactions.filter(tx => 
            tx.customerName === customer.displayName && 
            tx.createdAt && 
            new Date(tx.createdAt) >= start && 
            new Date(tx.createdAt) <= end
          );
          
          const totalSpent = customerTransactions
            .filter(tx => tx.paymentStatus === 'completed')
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            
          // Group transactions by date to count visits
          const visits = customerTransactions.reduce((dates, tx) => {
            if (tx.createdAt) {
              const dateStr = new Date(tx.createdAt).toDateString();
              if (!dates.includes(dateStr)) {
                dates.push(dateStr);
              }
            }
            return dates;
          }, [] as string[]);
          
          return {
            customerId: customer.id,
            name: customer.displayName,
            gamingName: customer.gamingName,
            email: customer.email || 'N/A',
            phone: customer.phoneNumber,
            loyaltyPoints: customer.points || 0,
            totalVisits: visits.length,
            totalSpent: totalSpent.toFixed(2),
            averageSpendPerVisit: visits.length > 0 ? (totalSpent / visits.length).toFixed(2) : '0.00'
          };
        });
      }
      
      case 'inventory':
        // Not implemented yet, would require inventory table
        return [
          { message: 'Inventory reporting will be available in a future update.' }
        ];
      
      case 'financial': {
        const transactions = await storage.getTransactions();
        const completedTransactions = transactions.filter(tx => 
          tx.paymentStatus === 'completed' && 
          tx.createdAt && 
          new Date(tx.createdAt) >= start && 
          new Date(tx.createdAt) <= end
        );
        
        // Group by day
        const dailyRevenue: Record<string, number> = {};
        completedTransactions.forEach(tx => {
          if (tx.createdAt) {
            const dateStr = new Date(tx.createdAt).toDateString();
            dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + parseFloat(tx.amount);
          }
        });
        
        // Calculate statistics
        const total = Object.values(dailyRevenue).reduce((sum, amount) => sum + amount, 0);
        const dailyAverage = Object.keys(dailyRevenue).length > 0 
          ? total / Object.keys(dailyRevenue).length 
          : 0;
        
        // Group by payment method (would need to join with payments table)
        const bySessionType = completedTransactions.reduce((acc, tx) => {
          const type = tx.sessionType;
          acc[type] = (acc[type] || 0) + parseFloat(tx.amount);
          return acc;
        }, {} as Record<string, number>);
        
        // Format for report
        return [
          { 
            startDate: start.toLocaleDateString(),
            endDate: end.toLocaleDateString(),
            totalRevenue: total.toFixed(2),
            totalTransactions: completedTransactions.length,
            averageTransactionValue: completedTransactions.length > 0 
              ? (total / completedTransactions.length).toFixed(2) 
              : '0.00',
            dailyAverage: dailyAverage.toFixed(2),
            hourlyRevenue: bySessionType['hourly'] ? bySessionType['hourly'].toFixed(2) : '0.00',
            perGameRevenue: bySessionType['per_game'] ? bySessionType['per_game'].toFixed(2) : '0.00'
          },
          ...Object.entries(dailyRevenue).map(([date, amount]) => ({
            date,
            amount: amount.toFixed(2)
          }))
        ];
      }
      
      default:
        throw new Error(`Unsupported report type: ${options.type}`);
    }
  } catch (error) {
    console.error(`Error getting report data for ${type}:`, error);
    throw error;
  }
}

/**
 * Generate CSV report
 */
function generateCSV(data: any[], reportType: ReportType, res: Response): void {
  try {
    // Convert data to CSV string
    const csvContent = stringify(data, {
      header: true,
      columns: Object.keys(data[0] || {})
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.csv"`);
    
    // Send CSV content
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Failed to generate CSV report' });
  }
}

/**
 * Generate Excel report
 */
async function generateExcel(data: any[], reportType: ReportType, res: Response): Promise<void> {
  try {
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${reportType} Report`);
    
    // Add header row
    const headers = Object.keys(data[0] || {});
    worksheet.addRow(headers);
    
    // Format header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' } };
    
    // Add data rows
    data.forEach(item => {
      const row = headers.map(header => item[header]);
      worksheet.addRow(row);
    });
    
    // Auto-size columns
    worksheet.columns.forEach(column => {
      const lengths = column.values?.filter(v => v !== undefined).map(v => v.toString().length);
      const maxLength = Math.max(...(lengths || [0]), 10);
      column.width = maxLength + 2;
    });
    
    // Create a temp file
    const tempFilePath = path.join(tempDir, `${reportType}-report-${Date.now()}.xlsx`);
    
    // Write to file then stream to response
    await workbook.xlsx.writeFile(tempFilePath);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.xlsx"`);
    
    // Stream file to response
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);
    
    // Clean up file after streaming
    fileStream.on('end', () => {
      fs.unlinkSync(tempFilePath);
    });
  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
}

/**
 * Generate PDF report
 */
function generatePDF(data: any[], reportType: ReportType, res: Response): void {
  try {
    // Create a temp file path
    const tempFilePath = path.join(tempDir, `${reportType}-report-${Date.now()}.pdf`);
    
    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(tempFilePath);
    
    // Pipe to write stream
    doc.pipe(writeStream);
    
    // Add title
    doc.fontSize(20).text(`${capitalizeFirstLetter(reportType)} Report`, {
      align: 'center'
    });
    doc.moveDown();
    
    // Add date
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: 'center'
    });
    doc.moveDown(2);
    
    // Add table headers
    const headers = Object.keys(data[0] || {});
    const columnWidth = 500 / headers.length;
    
    // Draw headers
    doc.fontSize(10).font('Helvetica-Bold');
    let x = 50;
    headers.forEach(header => {
      doc.text(formatHeader(header), x, doc.y, {
        width: columnWidth,
        align: 'left'
      });
      x += columnWidth;
    });
    doc.moveDown();
    
    // Draw horizontal line
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    doc.moveDown(0.5);
    
    // Add data rows
    doc.font('Helvetica');
    data.forEach((item, i) => {
      x = 50;
      const startY = doc.y;
      let maxHeight = 0;
      
      // Calculate max height needed for this row
      headers.forEach(header => {
        const cellValue = item[header]?.toString() || '';
        const textHeight = doc.heightOfString(cellValue, {
          width: columnWidth,
          align: 'left'
        });
        maxHeight = Math.max(maxHeight, textHeight);
      });
      
      // Draw row with consistent height
      headers.forEach(header => {
        const cellValue = item[header]?.toString() || '';
        doc.text(cellValue, x, startY, {
          width: columnWidth,
          align: 'left'
        });
        x += columnWidth;
      });
      
      doc.y = startY + maxHeight + 5;
      
      // Add light gray background for every other row
      if (i % 2 === 1) {
        doc.rect(50, startY - 2, 500, maxHeight + 4)
           .fill('#f5f5f5');
      }
      
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }
    });
    
    // Finalize PDF
    doc.end();
    
    // When file is written, stream it to response
    writeStream.on('finish', () => {
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
      
      // Stream file to response
      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.pipe(res);
      
      // Clean up file after streaming
      fileStream.on('end', () => {
        fs.unlinkSync(tempFilePath);
      });
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
}

// Helper functions
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatHeader(header: string): string {
  return header
    // Convert camelCase to separate words
    .replace(/([A-Z])/g, ' $1')
    // Convert snake_case to separate words
    .replace(/_/g, ' ')
    // Capitalize first letter of each word
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}