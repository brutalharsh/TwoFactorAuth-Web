# 🔐 Two Factor Auth

<div align="center">
  <img src="public/applogo.png" alt="Two Factor Auth Logo" width="120" height="120" />

  <h3 align="center">Secure 2FA Authenticator with Cloud Sync</h3>

  <p align="center">
    A modern, secure two-factor authentication app with QR code scanning, cloud synchronization, and dark mode support.
    <br />
    <a href="#features"><strong>Explore Features »</strong></a>
    <br />
    <br />
    <a href="#demo">View Demo</a>
    ·
    <a href="https://github.com/yourusername/pass-guard-suite/issues">Report Bug</a>
    ·
    <a href="https://github.com/yourusername/pass-guard-suite/issues">Request Feature</a>
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
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## 🎯 About

Two Factor Auth is a professional-grade two-factor authentication (2FA) application that helps users secure their online accounts with Time-based One-Time Passwords (TOTP). Built with modern web technologies and a focus on security, it provides a seamless experience across all devices with cloud synchronization.

### Why Two Factor Auth?

- **🔒 Security First**: All secrets are encrypted using Web Crypto API before storage
- **☁️ Cloud Sync**: Access your 2FA codes from any device
- **📱 Responsive**: Works perfectly on desktop, tablet, and mobile
- **🌙 Dark Mode**: Easy on the eyes with automatic theme detection
- **📸 QR Scanner**: Quickly add accounts by scanning QR codes
- **🚀 Fast**: Built with Vite for lightning-fast performance

## ✨ Features

### Core Features

- ✅ **TOTP Code Generation** - Generate 6/8 digit codes with SHA1/SHA256/SHA512 algorithms
- ✅ **Cloud Synchronization** - Sync across all your devices with Supabase
- ✅ **QR Code Scanner** - Add accounts by scanning or uploading QR code images
- ✅ **Dark/Light Mode** - Automatic theme detection with manual override
- ✅ **Account Management** - Add, edit, delete, and organize your 2FA accounts
- ✅ **Search & Filter** - Quickly find accounts with instant search
- ✅ **Export QR Codes** - Export any account as a QR code for backup
- ✅ **Secure Authentication** - Email/password authentication with Supabase Auth
- ✅ **Real-time Updates** - Live countdown timers with visual indicators

### Security Features

- 🔐 **Encrypted Storage** - AES-GCM 256-bit encryption for all secrets
- 🔑 **PBKDF2 Key Derivation** - 100,000 iterations for maximum security
- 🛡️ **Row Level Security** - Database-level isolation of user data
- 📋 **Clipboard Auto-clear** - Optional auto-clear after copying codes
- ⏰ **Session Management** - Secure session handling with auto-refresh

### Coming Soon

- 📱 PWA Support - Install as a mobile app
- 🔄 Google Authenticator Migration - Import from Google Authenticator
- 📦 Bulk Import/Export - Backup and restore all accounts
- ⌨️ Keyboard Shortcuts - Navigate faster with keyboard
- 🎯 Biometric Authentication - Face ID/Touch ID support

## 🛠️ Tech Stack

### Frontend

- **React 18.3** - UI library
- **TypeScript 5.8** - Type safety
- **Vite 5.4** - Build tool
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component library
- **React Router v6** - Routing
- **TanStack Query** - Server state management

### Backend & Database

- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions

### Security & Crypto

- **Web Crypto API** - Encryption/decryption
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
   git clone https://github.com/yourusername/pass-guard-suite.git
   cd pass-guard-suite
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

   Go to your Supabase SQL Editor and run:

   ```sql
   -- Create accounts table
   CREATE TABLE public.accounts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     issuer TEXT NOT NULL,
     account_name TEXT NOT NULL,
     secret TEXT NOT NULL,
     algorithm TEXT DEFAULT 'SHA1',
     digits INTEGER DEFAULT 6,
     period INTEGER DEFAULT 30,
     icon_name TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     last_used TIMESTAMPTZ,
     order_index INTEGER DEFAULT 0,
     encrypted_secret TEXT,
     encryption_iv TEXT,
     encryption_salt TEXT,
     is_encrypted BOOLEAN DEFAULT false,
     UNIQUE(user_id, issuer, account_name)
   );

   -- Enable RLS
   ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

   -- Create RLS policies
   CREATE POLICY "Users can only see their own accounts"
     ON public.accounts FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can only insert their own accounts"
     ON public.accounts FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can only update their own accounts"
     ON public.accounts FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can only delete their own accounts"
     ON public.accounts FOR DELETE
     USING (auth.uid() = user_id);

   -- Create indexes
   CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
   CREATE INDEX idx_accounts_order ON public.accounts(user_id, order_index);
   ```

2. **Enable Authentication**
   - Go to Authentication > Providers
   - Enable Email/Password authentication

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

### Adding Your First Account

1. **Sign up or log in** with your email and password
2. Click the **"+ Add Account"** button
3. Choose one of three methods:
   - **Manual Entry**: Enter the service name and secret key
   - **Import URI**: Paste an otpauth:// URI
   - **Scan QR**: Upload a QR code image

### Managing Accounts

- **Generate Codes**: Codes automatically refresh every 30 seconds
- **Copy Codes**: Click any code to copy it to your clipboard
- **Search**: Use the search bar to filter accounts
- **Export**: Click the menu icon to export an account as QR code

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
│   ├── AuthContext.tsx  # Authentication state
│   └── ThemeContext.tsx # Theme management
├── lib/                 # Utility functions
│   ├── crypto.ts        # Encryption utilities
│   ├── totp.ts          # TOTP generation
│   └── utils.ts         # Helper functions
├── pages/               # Route components
│   ├── Dashboard.tsx    # Main app view
│   ├── Auth.tsx         # Login/signup
│   └── NotFound.tsx     # 404 page
└── integrations/        # External services
    └── supabase/        # Supabase client
```

## 🔒 Security

Two Factor Auth takes security seriously:

### Data Protection

- **Encryption at Rest**: All TOTP secrets are encrypted using AES-GCM 256-bit encryption
- **Key Derivation**: PBKDF2 with 100,000 iterations for key generation
- **Secure Transport**: All data transmitted over HTTPS
- **Database Security**: Row Level Security ensures data isolation

### Best Practices

- Regular security audits
- Dependency updates
- No tracking or analytics
- Open source for transparency

### Reporting Security Issues

Please report security vulnerabilities to [security@passguardsuite.com]

## 🗺️ Roadmap

### Version 1.1 (Q1 2025)

- [ ] PWA support with offline mode
- [ ] Biometric authentication
- [ ] Bulk import/export
- [ ] Account categories/folders

### Version 1.2 (Q2 2025)

- [ ] Browser extension
- [ ] Desktop app (Electron)
- [ ] Backup encryption
- [ ] Account sharing (teams)

### Version 2.0 (Q3 2025)

- [ ] Mobile apps (iOS/Android)
- [ ] Hardware key support
- [ ] Advanced backup options
- [ ] Enterprise features

## 🤝 Contributing

Contributions are what make the open source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

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
- All contributors who help improve this project

---

<div align="center">
  <sub>Built with ❤️ by Harsh</sub>
</div>
