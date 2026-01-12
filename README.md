<p align="center">
  <img src="https://img.icons8.com/fluency/96/combo-chart.png" alt="Trade Ledger Pro Logo" width="80" height="80"/>
</p>

<h1 align="center">📈 Trade Ledger Pro</h1>

<p align="center">
  <strong>Your Intelligent Trading Journal & Analytics Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#environment-variables">Environment Variables</a> •
  <a href="#usage">Usage</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

---

## 🎯 Overview

**Trade Ledger Pro** is a comprehensive, AI-powered trading journal designed to help traders track, analyze, and improve their trading performance. Whether you're a day trader, swing trader, or long-term investor, Trade Ledger Pro provides the insights you need to become a more disciplined and profitable trader.

> *"The goal of a successful trader is to make the best trades. Money is secondary."* — Alexander Elder

---

## ✨ Features

### 📊 **Dashboard & Trade Management**
- 📝 Log trades with detailed entry/exit prices, quantities, and notes
- 🎯 Set stop-loss and take-profit levels
- ⭐ Star your best trades for quick reference
- 🔍 Filter trades by date and status (Open/Closed)
- 📱 Fully responsive design for mobile and desktop

### 📅 **Calendar View**
- 🗓️ Visual calendar with daily P&L heatmap
- 🟢🔴 Color-coded profit/loss days at a glance
- 📈 Quick daily performance overview

### 📈 **Advanced Analytics**
- 📊 Win rate, profit factor, and Sharpe ratio calculations
- 📉 Maximum drawdown tracking
- 🎯 Risk/reward ratio analysis
- 📊 Performance breakdown by symbol
- 📆 Daily, weekly, and monthly performance trends
- 🏆 Best and worst trade analysis

### 🎯 **Goals & Targets**
- 📅 Set monthly P&L targets
- 🎯 Target win rate tracking
- 📊 Visual progress indicators
- ⚠️ Goal alert notifications

### 📚 **Learning Center**
- ❌ Track and categorize trading mistakes
- 📋 Create and manage trading rules
- 🔄 Mistake frequency tracking
- 💡 Learn from your patterns

### 🤖 **AI-Powered Assistant**
- 💬 Intelligent chatbot powered by Google Gemini
- 📊 Get instant insights about your trading performance
- 🎤 Voice input support for hands-free queries
- 📈 Personalized recommendations based on your data

### 🔔 **Notifications & Reports**
- 📧 Weekly email performance reports
- 🎯 Goal achievement alerts
- 📊 Automated performance summaries

### 🔐 **Security**
- 🔒 Secure authentication with JWT
- 📧 Email OTP verification
- 🛡️ Password encryption with bcrypt

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1 (App Router) |
| **Frontend** | React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL |
| **ORM** | Prisma 5 |
| **Authentication** | JWT + bcrypt |
| **AI** | Google Gemini API |
| **Email** | Nodemailer |

---

## 🚀 Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key (for AI features)
- SMTP credentials (for email features)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trade-book.git
   cd trade-book
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables (see below)

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/tradebook?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key"

# Google Gemini AI (for AI chatbot)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.0-flash"

# Email Configuration (for OTP and weekly reports)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📖 Usage

### Adding a Trade
1. Click the **"+ New Trade"** button on the dashboard
2. Fill in the trade details (symbol, type, entry price, quantity)
3. Optionally add stop-loss, take-profit, and notes
4. Click **"Add Trade"** to save

### Closing a Trade
1. Find the trade you want to close
2. Click the **edit** button
3. Enter the exit price
4. The P&L will be automatically calculated

### Using the AI Assistant
1. Click the **chat bubble** icon in the bottom right
2. Ask questions like:
   - *"What's my win rate this month?"*
   - *"Show me my best performing symbol"*
   - *"How can I improve my trading?"*
3. Use the **microphone** button for voice input

### Setting Goals
1. Navigate to the **Goals** tab
2. Set your monthly targets for P&L, win rate, and max trades
3. Track your progress throughout the month

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Dashboard
> Main dashboard with trade list, stats cards, and quick actions

### Calendar View
> Visual calendar showing daily P&L with color-coded heatmap

### Analytics
> Comprehensive analytics with charts and performance metrics

### AI Chatbot
> Intelligent trading assistant for insights and analysis

</details>

---

## 🗂️ Project Structure

```
trade-book/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── public/                # Static assets
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── chat/      # AI chatbot endpoint
│   │   │   ├── goals/     # Goals management
│   │   │   ├── mistakes/  # Mistakes tracking
│   │   │   ├── notifications/
│   │   │   ├── rules/     # Trading rules
│   │   │   └── trades/    # Trade CRUD operations
│   │   ├── dashboard/     # Main dashboard page
│   │   ├── login/         # Login page
│   │   ├── signup/        # Signup page
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   ├── AIChatbot.tsx
│   │   ├── AnalyticsView.tsx
│   │   ├── CalendarView.tsx
│   │   ├── GoalsView.tsx
│   │   ├── LearningCenter.tsx
│   │   └── ...
│   ├── context/           # React contexts
│   └── lib/               # Utility functions
├── .env                   # Environment variables
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test your changes before submitting

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Google Gemini](https://ai.google.dev/) - AI capabilities

---

<p align="center">
  <strong>Made with ❤️ for traders, by traders</strong>
</p>

<p align="center">
  ⭐ Star this repo if you find it helpful!
</p>

---

## 🛠️ PostgreSQL Setup Guide (Windows)

<details>
<summary>Click to expand PostgreSQL installation guide</summary>

### Step 1: Download PostgreSQL

1. Go to the official PostgreSQL download page: https://www.postgresql.org/download/windows/
2. Click on "Download the installer" (this will take you to EnterpriseDB)
3. Download the latest version (PostgreSQL 16.x recommended)

### Step 2: Install PostgreSQL

1. Run the downloaded installer (`postgresql-16.x-x-windows-x64.exe`)
2. Click "Next" on the welcome screen
3. **Installation Directory**: Keep the default (`C:\Program Files\PostgreSQL\16`) or choose your preferred location
4. **Select Components**: Make sure these are checked:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (GUI tool for database management)
   - ✅ Stack Builder (optional)
   - ✅ Command Line Tools
5. **Data Directory**: Keep the default or choose your preferred location
6. **Password**: Set a strong password for the superuser (postgres)
   - ⚠️ **IMPORTANT**: Remember this password! You'll need it later.
7. **Port**: Keep the default `5432` unless you have a conflict
8. **Locale**: Select "Default locale" or your preferred locale
9. Click "Next" and then "Finish" to complete installation

### Step 3: Verify Installation

1. Open Command Prompt (cmd) or PowerShell
2. Run the following command to check if PostgreSQL is installed:
   ```powershell
   psql --version
   ```
   You should see something like: `psql (PostgreSQL) 16.x`

</details>

