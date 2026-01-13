import nodemailer from 'nodemailer';

// Lazy initialization to avoid build-time errors
let transporter: nodemailer.Transporter | null = null;

// Check if email is properly configured
function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter() {
  if (!transporter && isEmailConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

// Export function to check if email is configured
export function canSendEmail(): boolean {
  return isEmailConfigured();
}

interface WeeklyReportData {
  name: string;
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  totalPnL: number;
  profitableTrades: number;
  losingTrades: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
  currency: string;
  weekStart: string;
  weekEnd: string;
}

export async function sendWeeklyReportEmail(email: string, data: WeeklyReportData): Promise<boolean> {
  // Skip if email not configured
  if (!isEmailConfigured()) {
    console.log('[DEMO MODE] Email not configured. Weekly report not sent.');
    return false;
  }

  try {
    const transport = getTransporter();
    if (!transport) return false;

    const formatCurrency = (amount: number) => {
      // Always use Indian Rupee symbol
      const symbol = '₹';
      return `${amount >= 0 ? '+' : ''}${symbol}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    await transport.sendMail({
      from: `"Trade Ledger Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📊 Your Weekly Trading Report - ${data.weekStart} to ${data.weekEnd}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px; color: #e5e7eb; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(to bottom, #111827, #0f172a); border-radius: 16px; padding: 30px; border: 1px solid #374151; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #10b981; margin: 0; font-size: 28px; }
            .header p { color: #9ca3af; margin-top: 8px; }
            .greeting { color: #e5e7eb; font-size: 18px; margin-bottom: 20px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 20px 0; }
            .stat-card { background: #1f2937; border-radius: 12px; padding: 16px; border: 1px solid #374151; }
            .stat-label { color: #9ca3af; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            .stat-green { color: #10b981; }
            .stat-red { color: #ef4444; }
            .stat-blue { color: #3b82f6; }
            .stat-white { color: #ffffff; }
            .highlight-box { background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .highlight-box h3 { color: white; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; }
            .highlight-box .value { color: white; font-size: 32px; font-weight: bold; }
            .trade-highlight { background: #1f2937; border-radius: 12px; padding: 16px; margin: 10px 0; border: 1px solid #374151; }
            .trade-highlight .label { color: #9ca3af; font-size: 12px; margin-bottom: 4px; }
            .trade-highlight .symbol { color: white; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; border-top: 1px solid #374151; padding-top: 20px; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📈 Trade Ledger Pro</h1>
              <p>Weekly Performance Report</p>
            </div>
            
            <p class="greeting">Hello ${data.name}! 👋</p>
            <p style="color: #9ca3af; margin-bottom: 24px;">Here's your trading performance for <strong style="color: white;">${data.weekStart} - ${data.weekEnd}</strong></p>
            
            <div class="highlight-box" style="${data.totalPnL < 0 ? 'background: linear-gradient(135deg, #ef4444, #dc2626);' : ''}">
              <h3>Total P&L This Week</h3>
              <div class="value">${formatCurrency(data.totalPnL)}</div>
            </div>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Trades</div>
                <div class="stat-value stat-white">${data.totalTrades}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Closed Trades</div>
                <div class="stat-value stat-white">${data.closedTrades}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Win Rate</div>
                <div class="stat-value ${data.winRate >= 50 ? 'stat-green' : 'stat-red'}">${data.winRate.toFixed(1)}%</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Profitable</div>
                <div class="stat-value stat-green">${data.profitableTrades}</div>
              </div>
            </div>
            
            ${data.bestTrade ? `
            <div class="trade-highlight">
              <div class="label">🏆 Best Trade</div>
              <div><span class="symbol">${data.bestTrade.symbol}</span> - <span class="stat-green">${formatCurrency(data.bestTrade.pnl)}</span></div>
            </div>
            ` : ''}
            
            ${data.worstTrade ? `
            <div class="trade-highlight">
              <div class="label">📉 Worst Trade</div>
              <div><span class="symbol">${data.worstTrade.symbol}</span> - <span class="stat-red">${formatCurrency(data.worstTrade.pnl)}</span></div>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tradeledgerpro.vercel.app/'}/dashboard" class="cta-button">View Full Analytics →</a>
            </div>
            
            <div class="footer">
              <p>Keep journaling your trades to improve your performance! 🚀</p>
              <p>© 2026 Trade Ledger Pro. All rights reserved.</p>
              <p style="margin-top: 10px;">You received this email because you enabled weekly reports. <br/>You can disable them in your notification settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send weekly report email:', error);
    return false;
  }
}

export async function sendGoalAlertEmail(
  email: string, 
  name: string, 
  goalType: string, 
  currentValue: number, 
  targetValue: number, 
  percentage: number,
  currency: string
): Promise<boolean> {
  // Skip if email not configured
  if (!isEmailConfigured()) {
    console.log('[DEMO MODE] Email not configured. Goal alert not sent.');
    return false;
  }

  try {
    const transport = getTransporter();
    if (!transport) return false;

    const formatCurrency = (amount: number) => {
      // Always use Indian Rupee symbol
      const symbol = '₹';
      return `${symbol}${Math.abs(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isWinRate = goalType === 'Win Rate';
    const currentDisplay = isWinRate ? `${currentValue.toFixed(1)}%` : formatCurrency(currentValue);
    const targetDisplay = isWinRate ? `${targetValue}%` : formatCurrency(targetValue);

    await transport.sendMail({
      from: `"Trade Ledger Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🎯 Goal Alert: You've reached ${percentage}% of your ${goalType} target!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px; color: #e5e7eb; }
            .container { max-width: 500px; margin: 0 auto; background: linear-gradient(to bottom, #111827, #0f172a); border-radius: 16px; padding: 30px; border: 1px solid #374151; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #10b981; margin: 0; font-size: 24px; }
            .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
            .progress-container { background: #1f2937; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .progress-bar { height: 20px; background: #374151; border-radius: 10px; overflow: hidden; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); border-radius: 10px; }
            .stats { display: flex; justify-content: space-between; margin-top: 12px; color: #9ca3af; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📈 Trade Ledger Pro</h1>
            </div>
            <div class="celebration">${percentage >= 100 ? '🎉🏆🎉' : percentage >= 75 ? '🔥' : '💪'}</div>
            <h2 style="text-align: center; color: white;">${percentage >= 100 ? 'Congratulations!' : 'Great Progress!'}</h2>
            <p style="text-align: center; color: #9ca3af;">
              You've reached <strong style="color: #10b981;">${percentage}%</strong> of your <strong style="color: white;">${goalType}</strong> target!
            </p>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%;"></div>
              </div>
              <div class="stats">
                <span>Current: <strong style="color: white;">${currentDisplay}</strong></span>
                <span>Target: <strong style="color: white;">${targetDisplay}</strong></span>
              </div>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 14px;">
              ${percentage >= 100 
                ? "You've achieved your goal! Time to set a new target! 🚀" 
                : `Keep going, you're doing great!`}
            </p>
            <div class="footer">
              <p>© 2026 Trade Ledger Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send goal alert email:', error);
    return false;
  }
}

export async function sendOTPEmail(email: string, otp: string, name: string): Promise<boolean> {
  // If email is not configured, log the OTP and return true (for development/demo mode)
  if (!isEmailConfigured()) {
    console.log(`[DEMO MODE] Email not configured. OTP for ${email}: ${otp}`);
    return true; // Return true so login flow continues
  }

  try {
    const transport = getTransporter();
    if (!transport) {
      console.log(`[DEMO MODE] No transporter available. OTP for ${email}: ${otp}`);
      return true;
    }

    await transport.sendMail({
      from: `"Trade Ledger Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Trade Ledger Pro Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; }
            .otp-box { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0; }
            .message { color: #666; line-height: 1.6; }
            .warning { color: #ef4444; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📈 Trade Ledger Pro</h1>
            </div>
            <p class="message">Hello ${name},</p>
            <p class="message">Your verification code for Trade Ledger Pro is:</p>
            <div class="otp-box">${otp}</div>
            <p class="message">Enter this code to complete your login.</p>
            <p class="warning">⏰ This code will expire in 5 minutes. Do not share this code with anyone.</p>
            <div class="footer">
              <p>© 2026 Trade Ledger Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Simulated SMS sending (you would integrate with Twilio or similar service)
export async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
  try {
    // In production, integrate with Twilio or similar service
    // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `Your Trade Ledger Pro verification code is: ${otp}. Valid for 5 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    console.log(`[SMS Simulation] Sending OTP ${otp} to ${phone}`);
    return true;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return false;
  }
}
