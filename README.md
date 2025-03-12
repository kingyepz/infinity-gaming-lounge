# Infinity Gaming Lounge POS System

A comprehensive Point of Sale (POS) system for gaming lounges, providing advanced station management and real-time customer engagement with local payment support.

## Overview

Infinity Gaming Lounge POS is a full-stack application designed specifically for gaming lounges in Kenya. It streamlines operations by managing gaming stations, tracking sessions, processing payments, and increasing customer engagement through a loyalty system.

The system combines modern web technologies with local payment methods to create a seamless experience for both staff and customers.

## Features

### Core Functionality
- **Game Station Management**: Track and manage multiple gaming stations
- **Session Tracking**: Real-time monitoring of active gaming sessions
- **Customer Management**: Register and manage customer profiles
- **Flexible Pricing**: Support for per-game and hourly pricing models
- **Payment Processing**: Multiple payment method support
- **Reporting & Analytics**: Track revenue, popular games, and station utilization

### Payment Options
- Cash payments
- M-Pesa integration
- Airtel Money integration 
- QR code payment support

### Customer Engagement
- Customer profiles with gaming preferences
- Loyalty points system
- Session history tracking
- Split payment support for group sessions

### Technical Features
- Real-time updates via WebSockets
- Responsive design for different devices
- Role-based access control (Admin, Staff, Customer)
- Secure authentication system
- Digital receipt generation

## Technology Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Shadcn/ui component library
- TanStack React Query for data fetching
- React Hook Form for form handling
- PDF generation for receipts
- Firebase Authentication (optional)

### Backend
- Node.js with Express
- PostgreSQL database with Drizzle ORM
- WebSocket support for real-time updates
- M-Pesa API integration
- Airtel Money API integration

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- M-Pesa developer account (for payment processing)
- Airtel Money developer account (for payment processing)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kingyepz/infinity-gaming-lounge.git
   cd infinity-gaming-lounge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/infinity_gaming
   MPESA_CONSUMER_KEY=your_mpesa_consumer_key
   MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
   MPESA_SHORTCODE=your_mpesa_shortcode
   MPESA_PASSKEY=your_mpesa_passkey
   AIRTEL_API_KEY=your_airtel_api_key
   AIRTEL_SECRET_KEY=your_airtel_secret_key
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Admin Portal
- Access comprehensive analytics
- Manage game stations and catalog
- View transaction history
- Manage staff accounts

### Staff POS Interface
- Register new customers
- Start and end gaming sessions
- Process payments
- Manage active stations

### Customer Portal
- View loyalty points
- See session history
- Update profile information

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for the component library
- [Drizzle ORM](https://orm.drizzle.team/) for database operations
- [Safaricom M-Pesa API](https://developer.safaricom.co.ke/) for payment processing
- [Airtel Money API](https://developers.airtel.africa/) for payment processing