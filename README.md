# 🔐 Two Factor Auth

<div align="center">
  <img src="public/applogo.png" alt="Two Factor Auth Logo" width="120" height="120" />

  <h3 align="center">Secure 2FA Authenticator</h3>

  <p align="center">
    A modern two-factor authentication app with QR code scanning and dark mode support.
    <br />
    <a href="#features"><strong>Explore Features »</strong></a>
    <br />
    <br />
    <a href="#demo">View Demo</a>
    ·
    <a href="https://github.com/brutalharsh/TwoFactorAuth-Web/issues">Report Bug</a>
    ·
    <a href="https://github.com/brutalharsh/TwoFactorAuth-Web/issues">Request Feature</a>
  </p>

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.76-3ecf8e.svg)

</div>

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
- [Usage](#usage)
- [Architecture](#architecture)
- [Security Notice](#security-notice)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## 🎯 About

Two Factor Auth is a two-factor authentication (2FA) application that helps users secure their online accounts with Time-based One-Time Passwords (TOTP). Built with modern web technologies, it provides a seamless experience across all devices.

### Why Two Factor Auth?

- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile
- **🌙 Dark Mode**: Easy on the eyes with automatic theme detection
- **📸 QR Scanner**: Quickly add accounts by scanning QR codes
- **🚀 Fast**: Built with Vite for lightning-fast performance
- **🔑 Username-Based**: Simple username/password authentication

## ✨ Features

### Core Features

- ✅ **TOTP Code Generation** - Generate 6/8 digit codes with SHA1/SHA256/SHA512 algorithms
- ✅ **QR Code Scanner** - Add accounts by scanning or uploading QR code images
- ✅ **Dark/Light Mode** - Automatic theme detection with manual override
- ✅ **Account Management** - Add and organize your 2FA accounts
- ✅ **Search & Filter** - Quickly find accounts with instant search
- ✅ **Export QR Codes** - Export any account as a QR code for backup
- ✅ **Custom Authentication** - Username/password authentication
- ✅ **Real-time Updates** - Live countdown timers with visual indicators

### ⚠️ Development Features

- 📝 **Plain Text Passwords** - For development only (NOT FOR PRODUCTION)
- 🔓 **Disabled RLS** - Row Level Security disabled for development

## 🛠️ Tech Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component library
- **React Router v6** - Routing

### Backend & Database

- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Custom authentication system
  - Database client

### Security & Crypto

- **Web Crypto API** - Encryption/decryption (infrastructure ready)
- **jsotp** - TOTP generation
- **qrcode** - QR code generation
- **qr-scanner** - QR code scanning

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**
- **Supabase Account** (free tier available)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/brutalharsh/TwoFactorAuth-Web.git
   cd TwoFactorAuth
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Copy environment variables**
   ```bash
   cp .env.example .env
   ```

### Environment Setup

1. **Create a Supabase Project**

   - Go to [Supabase](https://supabase.com)
   - Click "New Project"
   - Fill in project details
   - Wait for project to be ready

2. **Get your API keys**

   - Go to Settings > API
   - Copy your project URL and anon/public key

3. **Update .env file**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

### Database Setup

1. **Run the migration**

   Go to your Supabase SQL Editor and run the migration from:
   `/supabase/migrations/username_only_schema.sql`

   This will create:
   - `users` table with username and password fields
   - `auths` table for 2FA accounts
   - Necessary indexes and triggers

2. **Note**: Row Level Security is disabled for development

### Running the Application

1. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:8080`

3. **Build for production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## 📱 Usage

### Creating an Account

1. **Sign up** with a username and password
2. **Log in** with your credentials

### Adding Your First 2FA Account

1. Click the **"+ Add Account"** button
2. Choose one of three methods:
   - **Manual Entry**: Enter the service name and secret key
   - **Import URI**: Paste an otpauth:// URI
   - **Scan QR**: Upload a QR code image

### Managing Accounts

- **Generate Codes**: Codes automatically refresh every 30 seconds
- **Copy Codes**: Click any code to copy it to your clipboard
- **Search**: Use the search bar to filter accounts

## 🏗️ Architecture

```
src/
├── components/          # Reusable UI components
│   ├── AccountCard.tsx  # Individual account display
│   ├── AddAccountModal.tsx # Add account dialog
│   ├── QRScannerModal.tsx # QR scanning
│   ├── ThemeToggle.tsx  # Theme switcher
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Custom authentication
│   └── ThemeContext.tsx # Theme management
├── lib/                 # Utility functions
│   ├── crypto.ts        # Encryption utilities (ready for integration)
│   ├── totp.ts          # TOTP generation
│   └── utils.ts         # Helper functions
├── pages/               # Route components
│   ├── Dashboard.tsx    # Main app view
│   ├── Auth.tsx         # Login/signup
│   └── NotFound.tsx     # 404 page
└── integrations/        # External services
    └── supabase/        # Supabase client
```

## 🔒 Security Notice

⚠️ **IMPORTANT**: This is a development version with the following security considerations:

### Current Implementation (Development Only)

- **Plain Text Passwords**: Passwords are stored without encryption
- **No RLS**: Row Level Security is disabled
- **Session Storage**: Uses localStorage for session management
- **No Email Verification**: Username-only authentication

### For Production

Before deploying to production, you MUST:

1. Implement password hashing (bcrypt, argon2, etc.)
2. Enable and configure Row Level Security
3. Implement proper session management
4. Add email verification
5. Encrypt TOTP secrets before storage
6. Use secure authentication methods

## 🗺️ Roadmap

### Next Steps for Production

- [ ] Implement password hashing
- [ ] Enable Row Level Security
- [ ] Add email-based authentication
- [ ] Encrypt TOTP secrets
- [ ] Add backup/recovery options
- [ ] Implement rate limiting

### Future Features

- [ ] PWA support with offline mode
- [ ] Biometric authentication
- [ ] Bulk import/export
- [ ] Browser extension
- [ ] Mobile apps

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Project Link: [https://github.com/brutalharsh/TwoFactorAuth-Web.git](https://github.com/brutalharsh/TwoFactorAuth-Web.git)

Website: [https://auth.brutalharsh.me](https://auth.brutalharsh.me)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Radix UI](https://radix-ui.com) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Vite](https://vitejs.dev) - Lightning fast build tool
- [React](https://reactjs.org) - UI library

---

<div align="center">
  <sub>Built with ❤️ by Harsh</sub>
</div>