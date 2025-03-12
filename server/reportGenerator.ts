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
export type ReportType = 'revenue' | 'usage' | 'games' | 'customers' | 'inventory' | 'financial' | 'loyalty' | 'hourly' | 'comparative' | 'predictive' | 'heatmap' | 'segmentation';
export type ReportFormat = 'csv' | 'pdf' | 'excel' | 'json';

export interface ReportOptions {
  type: ReportType;
  format: ReportFormat;
  startDate?: Date;
  endDate?: Date;
  stationId?: number;
  gameId?: number;
  userId?: number;
  startHour?: number;
  endHour?: number;
  comparePeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  segmentType?: 'frequency' | 'spending' | 'age' | 'games';
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
      case 'json':
        return generateJSON(data, options.type, res);
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
  const { type, startDate, endDate, startHour, endHour, comparePeriod, segmentType } = options;
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
  const end = endDate || new Date();
  const hourStart = startHour || 0;
  const hourEnd = endHour || 23;
  
  try {
    // Helper function to filter transactions by date and hour
    const filterByDateAndHour = (tx: any) => {
      if (!tx.createdAt) return false;
      
      const txDate = new Date(tx.createdAt);
      const txHour = txDate.getHours();
      
      return txDate >= start && 
             txDate <= end && 
             txHour >= hourStart && 
             txHour <= hourEnd;
    };
    
    switch (type) {
      case 'revenue': {
        const transactions = await storage.getTransactions();
        return transactions
          .filter(tx => filterByDateAndHour(tx) && tx.paymentStatus === 'completed')
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
            tx.stationId === station.id && filterByDateAndHour(tx)
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
            tx.gameName === game.name && filterByDateAndHour(tx)
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
            tx.customerName === customer.displayName && filterByDateAndHour(tx)
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
          tx.paymentStatus === 'completed' && filterByDateAndHour(tx)
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
            timeRange: `${hourStart}:00 - ${hourEnd}:59`,
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
      
      // New report types for advanced analytics
      
      case 'loyalty': {
        const customers = await storage.getCustomers();
        const transactions = await storage.getTransactions();
        
        // Group customers by loyalty tiers
        const tiers = [
          { name: 'Bronze', min: 0, max: 100 },
          { name: 'Silver', min: 101, max: 500 },
          { name: 'Gold', min: 501, max: 1000 },
          { name: 'Platinum', min: 1001, max: Number.MAX_SAFE_INTEGER }
        ];
        
        const customersByTier = tiers.map(tier => {
          const tierCustomers = customers.filter(customer => 
            (customer.points || 0) >= tier.min && 
            (customer.points || 0) <= tier.max
          );
          
          const totalPoints = tierCustomers.reduce((sum, customer) => sum + (customer.points || 0), 0);
          
          return {
            tierName: tier.name,
            pointRange: `${tier.min} - ${tier.max === Number.MAX_SAFE_INTEGER ? '∞' : tier.max}`,
            customerCount: tierCustomers.length,
            totalPoints: totalPoints,
            averagePoints: tierCustomers.length > 0 ? Math.round(totalPoints / tierCustomers.length) : 0
          };
        });
        
        // Top point earners
        const topCustomers = [...customers]
          .sort((a, b) => (b.points || 0) - (a.points || 0))
          .slice(0, 10)
          .map(customer => {
            const customerTransactions = transactions.filter(tx => 
              tx.customerName === customer.displayName && 
              tx.paymentStatus === 'completed' &&
              filterByDateAndHour(tx)
            );
            
            const totalSpent = customerTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
            
            return {
              customerId: customer.id,
              name: customer.displayName,
              gamingName: customer.gamingName,
              points: customer.points || 0,
              totalSpent: totalSpent.toFixed(2),
              transactionCount: customerTransactions.length
            };
          });
        
        return [
          {
            reportTitle: 'Loyalty Program Analysis',
            dateRange: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            timeRange: `${hourStart}:00 - ${hourEnd}:59`,
          },
          ...customersByTier,
          { sectionDivider: '------------------------' },
          { subsectionTitle: 'Top Point Earners' },
          ...topCustomers
        ];
      }
      
      case 'hourly': {
        const transactions = await storage.getTransactions();
        const filteredTransactions = transactions.filter(tx => 
          tx.createdAt && 
          new Date(tx.createdAt) >= start && 
          new Date(tx.createdAt) <= end
        );
        
        // Group by hour of day
        const hourlyData: Record<number, { count: number; revenue: number; }> = {};
        
        // Initialize all hours
        for (let i = 0; i <= 23; i++) {
          hourlyData[i] = { count: 0, revenue: 0 };
        }
        
        // Populate data
        filteredTransactions.forEach(tx => {
          if (tx.createdAt) {
            const hour = new Date(tx.createdAt).getHours();
            hourlyData[hour].count += 1;
            
            if (tx.paymentStatus === 'completed') {
              hourlyData[hour].revenue += parseFloat(tx.amount);
            }
          }
        });
        
        // Format for report
        return Object.entries(hourlyData)
          .filter(([hour]) => parseInt(hour) >= hourStart && parseInt(hour) <= hourEnd)
          .map(([hour, data]) => ({
            hour: `${hour}:00 - ${hour}:59`,
            sessions: data.count,
            revenue: data.revenue.toFixed(2),
            averageValue: data.count > 0 ? (data.revenue / data.count).toFixed(2) : '0.00'
          }));
      }
      
      case 'comparative': {
        const transactions = await storage.getTransactions();
        const period = comparePeriod || 'monthly';
        
        // Function to get date range for comparison
        const getDateRange = (date: Date, periodType: string): {start: Date, end: Date} => {
          const now = new Date(date);
          
          switch (periodType) {
            case 'daily': {
              // Today vs yesterday
              const start = new Date(now);
              start.setHours(0, 0, 0, 0);
              const end = new Date(now);
              end.setHours(23, 59, 59, 999);
              return { start, end };
            }
            case 'weekly': {
              // This week vs last week
              const dayOfWeek = now.getDay();
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - dayOfWeek);
              startOfWeek.setHours(0, 0, 0, 0);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              endOfWeek.setHours(23, 59, 59, 999);
              return { start: startOfWeek, end: endOfWeek };
            }
            case 'monthly': {
              // This month vs last month
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
              return { start: startOfMonth, end: endOfMonth };
            }
            case 'yearly': {
              // This year vs last year
              const startOfYear = new Date(now.getFullYear(), 0, 1);
              const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
              return { start: startOfYear, end: endOfYear };
            }
            default:
              return { start: new Date(0), end: new Date() };
          }
        };
        
        // Get current period
        const currentPeriod = getDateRange(new Date(), period);
        
        // Get previous period
        const previousPeriodEnd = new Date(currentPeriod.start);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
        
        let previousPeriodStart;
        switch (period) {
          case 'daily':
            previousPeriodStart = new Date(previousPeriodEnd);
            previousPeriodStart.setHours(0, 0, 0, 0);
            break;
          case 'weekly':
            previousPeriodStart = new Date(previousPeriodEnd);
            previousPeriodStart.setDate(previousPeriodStart.getDate() - 6);
            break;
          case 'monthly':
            previousPeriodStart = new Date(previousPeriodEnd.getFullYear(), previousPeriodEnd.getMonth(), 1);
            break;
          case 'yearly':
            previousPeriodStart = new Date(previousPeriodEnd.getFullYear(), 0, 1);
            break;
          default:
            previousPeriodStart = new Date(0);
        }
        
        // Filter transactions for each period
        const currentTransactions = transactions.filter(tx => 
          tx.createdAt && 
          new Date(tx.createdAt) >= currentPeriod.start && 
          new Date(tx.createdAt) <= currentPeriod.end
        );
        
        const previousTransactions = transactions.filter(tx => 
          tx.createdAt && 
          new Date(tx.createdAt) >= previousPeriodStart && 
          new Date(tx.createdAt) <= previousPeriodEnd
        );
        
        // Calculate metrics
        const calculateMetrics = (txs: any[]) => {
          const completedTxs = txs.filter(tx => tx.paymentStatus === 'completed');
          const totalRevenue = completedTxs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
          const uniqueCustomers = new Set(txs.map(tx => tx.customerName)).size;
          const totalHours = txs.reduce((sum, tx) => sum + (tx.duration || 0) / 60, 0);
          
          return {
            transactionCount: txs.length,
            revenue: totalRevenue,
            uniqueCustomers,
            averageTransactionValue: txs.length > 0 ? totalRevenue / txs.length : 0,
            totalHours
          };
        };
        
        const currentMetrics = calculateMetrics(currentTransactions);
        const previousMetrics = calculateMetrics(previousTransactions);
        
        // Calculate percentage changes
        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return current > 0 ? 100 : 0;
          return ((current - previous) / previous) * 100;
        };
        
        const changes = {
          transactionCount: calculateChange(currentMetrics.transactionCount, previousMetrics.transactionCount),
          revenue: calculateChange(currentMetrics.revenue, previousMetrics.revenue),
          uniqueCustomers: calculateChange(currentMetrics.uniqueCustomers, previousMetrics.uniqueCustomers),
          averageTransactionValue: calculateChange(currentMetrics.averageTransactionValue, previousMetrics.averageTransactionValue),
          totalHours: calculateChange(currentMetrics.totalHours, previousMetrics.totalHours)
        };
        
        return [
          {
            reportTitle: `Comparative Analysis (${period})`,
            periodType: period,
            currentPeriodStart: currentPeriod.start.toLocaleDateString(),
            currentPeriodEnd: currentPeriod.end.toLocaleDateString(),
            previousPeriodStart: previousPeriodStart.toLocaleDateString(),
            previousPeriodEnd: previousPeriodEnd.toLocaleDateString()
          },
          {
            metric: 'Total Transactions',
            current: currentMetrics.transactionCount,
            previous: previousMetrics.transactionCount,
            change: `${changes.transactionCount.toFixed(2)}%`,
            trend: changes.transactionCount >= 0 ? 'up' : 'down'
          },
          {
            metric: 'Total Revenue',
            current: `KES ${currentMetrics.revenue.toFixed(2)}`,
            previous: `KES ${previousMetrics.revenue.toFixed(2)}`,
            change: `${changes.revenue.toFixed(2)}%`,
            trend: changes.revenue >= 0 ? 'up' : 'down'
          },
          {
            metric: 'Unique Customers',
            current: currentMetrics.uniqueCustomers,
            previous: previousMetrics.uniqueCustomers,
            change: `${changes.uniqueCustomers.toFixed(2)}%`,
            trend: changes.uniqueCustomers >= 0 ? 'up' : 'down'
          },
          {
            metric: 'Average Transaction Value',
            current: `KES ${currentMetrics.averageTransactionValue.toFixed(2)}`,
            previous: `KES ${previousMetrics.averageTransactionValue.toFixed(2)}`,
            change: `${changes.averageTransactionValue.toFixed(2)}%`,
            trend: changes.averageTransactionValue >= 0 ? 'up' : 'down'
          },
          {
            metric: 'Total Hours',
            current: `${currentMetrics.totalHours.toFixed(2)} hrs`,
            previous: `${previousMetrics.totalHours.toFixed(2)} hrs`,
            change: `${changes.totalHours.toFixed(2)}%`,
            trend: changes.totalHours >= 0 ? 'up' : 'down'
          }
        ];
      }
      
      case 'predictive': {
        const transactions = await storage.getTransactions();
        const now = new Date();
        
        // Get transactions for the last 30 days
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);
        
        const recentTransactions = transactions.filter(tx => 
          tx.createdAt && 
          tx.paymentStatus === 'completed' &&
          new Date(tx.createdAt) >= last30Days
        );
        
        // Group by day of week
        const dayAverages: Record<number, { count: number, totalAmount: number, days: number }> = {};
        
        // Initialize all days
        for (let i = 0; i < 7; i++) {
          dayAverages[i] = { count: 0, totalAmount: 0, days: 0 };
        }
        
        // Calculate date ranges to count occurrences of each day of week
        const daysCounted = new Set<string>();
        
        // Populate data
        recentTransactions.forEach(tx => {
          if (tx.createdAt) {
            const date = new Date(tx.createdAt);
            const dayOfWeek = date.getDay();
            const dateStr = date.toDateString();
            
            dayAverages[dayOfWeek].count += 1;
            dayAverages[dayOfWeek].totalAmount += parseFloat(tx.amount);
            
            if (!daysCounted.has(`${dayOfWeek}-${dateStr}`)) {
              dayAverages[dayOfWeek].days += 1;
              daysCounted.add(`${dayOfWeek}-${dateStr}`);
            }
          }
        });
        
        // Calculate averages and forecast
        const forecast = [];
        let nextWeekTotal = 0;
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 7; i++) {
          const avgTransactions = dayAverages[i].days > 0 ? dayAverages[i].count / dayAverages[i].days : 0;
          const avgRevenue = dayAverages[i].days > 0 ? dayAverages[i].totalAmount / dayAverages[i].days : 0;
          
          // Add confidence factor (higher for days with more data points)
          const confidenceFactor = Math.min(dayAverages[i].days / 4, 1); // Max out at 4 data points (1 month)
          const adjustedRevenue = avgRevenue * confidenceFactor;
          
          nextWeekTotal += adjustedRevenue;
          
          forecast.push({
            day: dayNames[i],
            averageTransactions: avgTransactions.toFixed(2),
            predictedRevenue: adjustedRevenue.toFixed(2),
            confidenceLevel: `${(confidenceFactor * 100).toFixed(0)}%`
          });
        }
        
        return [
          {
            reportTitle: 'Revenue Forecast',
            forecastPeriod: 'Next 7 Days',
            basedOn: 'Last 30 Days Data',
            nextWeekTotal: nextWeekTotal.toFixed(2),
            forecastGenerated: new Date().toISOString()
          },
          ...forecast
        ];
      }
      
      case 'segmentation': {
        const customers = await storage.getCustomers();
        const transactions = await storage.getTransactions();
        
        const type = segmentType || 'frequency';
        
        if (type === 'frequency') {
          // Segment by visit frequency
          const segments = [
            { name: 'New', min: 1, max: 1 },
            { name: 'Occasional', min: 2, max: 5 },
            { name: 'Regular', min: 6, max: 15 },
            { name: 'Frequent', min: 16, max: 30 },
            { name: 'Power User', min: 31, max: Number.MAX_SAFE_INTEGER }
          ];
          
          const customerSegments = segments.map(segment => {
            // Count visits per customer
            const customerVisits: Record<number, { count: number, total: number }> = {};
            
            transactions.forEach(tx => {
              if (!tx.createdAt || !filterByDateAndHour(tx)) return;
              
              const customerId = customers.find(c => c.displayName === tx.customerName)?.id;
              if (!customerId) return;
              
              if (!customerVisits[customerId]) {
                customerVisits[customerId] = { count: 0, total: 0 };
              }
              
              if (tx.paymentStatus === 'completed') {
                customerVisits[customerId].total += parseFloat(tx.amount);
              }
              
              // Count unique days
              customerVisits[customerId].count += 1;
            });
            
            // Filter customers in this segment
            const segmentCustomers = Object.entries(customerVisits)
              .filter(([, data]) => data.count >= segment.min && data.count <= segment.max)
              .map(([id, data]) => ({ 
                id: parseInt(id), 
                visits: data.count, 
                total: data.total 
              }));
            
            const totalSpent = segmentCustomers.reduce((sum, c) => sum + c.total, 0);
            const totalVisits = segmentCustomers.reduce((sum, c) => sum + c.visits, 0);
            
            return {
              segmentName: segment.name,
              visitRange: `${segment.min} - ${segment.max === Number.MAX_SAFE_INTEGER ? '∞' : segment.max}`,
              customerCount: segmentCustomers.length,
              totalRevenue: totalSpent.toFixed(2),
              averageRevenuePerCustomer: segmentCustomers.length > 0 
                ? (totalSpent / segmentCustomers.length).toFixed(2) 
                : '0.00',
              percentOfTotal: customers.length > 0 
                ? ((segmentCustomers.length / customers.length) * 100).toFixed(2) 
                : '0.00'
            };
          });
          
          return [
            {
              reportTitle: 'Customer Segmentation by Visit Frequency',
              dateRange: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
              timeRange: `${hourStart}:00 - ${hourEnd}:59`,
              totalCustomers: customers.length
            },
            ...customerSegments
          ];
        } else if (type === 'spending') {
          // Segment by spending
          const segments = [
            { name: 'Low Spender', min: 0, max: 1000 },
            { name: 'Medium Spender', min: 1001, max: 5000 },
            { name: 'High Spender', min: 5001, max: 10000 },
            { name: 'VIP', min: 10001, max: Number.MAX_SAFE_INTEGER }
          ];
          
          // Calculate total spent per customer
          const customerSpending: Record<number, number> = {};
          
          transactions.forEach(tx => {
            if (!tx.createdAt || !filterByDateAndHour(tx) || tx.paymentStatus !== 'completed') return;
            
            const customerId = customers.find(c => c.displayName === tx.customerName)?.id;
            if (!customerId) return;
            
            if (!customerSpending[customerId]) {
              customerSpending[customerId] = 0;
            }
            
            customerSpending[customerId] += parseFloat(tx.amount);
          });
          
          const customerSegments = segments.map(segment => {
            // Filter customers in this segment
            const segmentCustomers = Object.entries(customerSpending)
              .filter(([, amount]) => amount >= segment.min && amount <= segment.max)
              .map(([id, amount]) => ({ 
                id: parseInt(id), 
                spent: amount 
              }));
            
            const totalSpent = segmentCustomers.reduce((sum, c) => sum + c.spent, 0);
            
            return {
              segmentName: segment.name,
              spendingRange: `KES ${segment.min} - ${segment.max === Number.MAX_SAFE_INTEGER ? '∞' : segment.max}`,
              customerCount: segmentCustomers.length,
              totalRevenue: totalSpent.toFixed(2),
              averageSpending: segmentCustomers.length > 0 
                ? (totalSpent / segmentCustomers.length).toFixed(2) 
                : '0.00',
              percentOfRevenue: Object.values(customerSpending).reduce((sum, amount) => sum + amount, 0) > 0
                ? ((totalSpent / Object.values(customerSpending).reduce((sum, amount) => sum + amount, 0)) * 100).toFixed(2)
                : '0.00'
            };
          });
          
          return [
            {
              reportTitle: 'Customer Segmentation by Spending',
              dateRange: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
              timeRange: `${hourStart}:00 - ${hourEnd}:59`,
              totalCustomers: customers.length,
              totalRevenue: Object.values(customerSpending).reduce((sum, amount) => sum + amount, 0).toFixed(2)
            },
            ...customerSegments
          ];
        }
        
        // Default fallback for other segment types
        return [
          {
            reportTitle: 'Customer Segmentation',
            message: `Segmentation by ${segmentType} is not available yet.`
          }
        ];
      }
      
      case 'heatmap': {
        const transactions = await storage.getTransactions();
        const stations = await storage.getGameStations();
        
        // Initialize data structure
        // For each day (0-6, Sunday-Saturday) and hour (0-23)
        const heatmapData = [];
        for (let day = 0; day < 7; day++) {
          for (let hour = hourStart; hour <= hourEnd; hour++) {
            heatmapData.push({
              day,
              hour,
              value: 0,
              count: 0,
            });
          }
        }
        
        // Process transactions
        transactions
          .filter(tx => tx.createdAt && new Date(tx.createdAt) >= start && new Date(tx.createdAt) <= end)
          .forEach(tx => {
            if (tx.createdAt) {
              const date = new Date(tx.createdAt);
              const day = date.getDay(); // 0-6, Sunday-Saturday
              const hour = date.getHours(); // 0-23
              
              // Skip if outside hour range
              if (hour < hourStart || hour > hourEnd) return;
              
              // Find the index in our heatmap array
              const index = (day * (hourEnd - hourStart + 1)) + (hour - hourStart);
              
              if (index >= 0 && index < heatmapData.length) {
                // Increment count
                heatmapData[index].count += 1;
                
                // For value, we use session duration if available, otherwise default values
                if (tx.duration) {
                  if (tx.sessionType === 'hourly') {
                    heatmapData[index].value += tx.duration / 60; // Convert minutes to hours
                  } else {
                    heatmapData[index].value += 0.5; // Assume 30 mins for per_game
                  }
                } else {
                  // If no duration, make assumptions based on session type
                  heatmapData[index].value += (tx.sessionType === 'hourly') ? 1 : 0.5;
                }
              }
            }
          });
        
        // Add utilization percentage (value/stations count)
        heatmapData.forEach(item => {
          item.utilization = stations.length > 0 
            ? ((item.value / stations.length) * 100).toFixed(2)
            : '0.00';
        });
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Format for report
        return heatmapData.map(item => ({
          day: dayNames[item.day],
          dayIndex: item.day,
          hour: `${item.hour}:00`,
          hourIndex: item.hour,
          sessions: item.count,
          hours: item.value.toFixed(2),
          utilizationPercentage: item.utilization
        }));
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

/**
 * Generate JSON report
 */
function generateJSON(data: any[], reportType: ReportType, res: Response): void {
  try {
    // Create JSON response with metadata
    const jsonReport = {
      reportType,
      generatedOn: new Date().toISOString(),
      recordCount: data.length,
      data
    };
    
    // Set response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.json"`);
    
    // Send JSON content
    res.json(jsonReport);
  } catch (error) {
    console.error('Error generating JSON:', error);
    res.status(500).json({ error: 'Failed to generate JSON report' });
  }
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