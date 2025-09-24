# 📦 Pongs Shipping Company

> A comprehensive full-stack shipping management system for streamlined package tracking and customer service operations.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB.svg?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Latest-339933.svg?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg?logo=postgresql)
![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900.svg?logo=amazon-aws)

## 🚀 Overview

Pongs Shipping Company is a modern, full-stack web application designed to revolutionize package management and customer service operations. Built with cutting-edge technologies, it provides a seamless experience for both customers and administrators to track, manage, and process international shipments.

### ✨ Key Features

- **📱 Customer Portal**: Self-service package tracking and pre-alert management
- **🛠️ Admin Dashboard**: Comprehensive package and customer management tools
- **☁️ Cloud Storage**: Secure receipt and document storage with AWS S3
- **📧 Email Notifications**: Automated customer notifications for package updates
- **🔐 Authentication**: Secure JWT-based authentication with role-based access
- **📊 Real-time Updates**: Live package status tracking and notifications
- **📱 Mobile Responsive**: Optimized for all devices and screen sizes

## 🏗️ Architecture

### Frontend (`pongs-shipping`)
- **Framework**: React 19.1.1 with modern hooks and context API
- **Styling**: Tailwind CSS 4.1.12 for responsive, utility-first design
- **Routing**: React Router DOM 7.8.2 for seamless navigation
- **HTTP Client**: Axios for API communication
- **Build Tool**: Vite 7.1.2 for fast development and optimized builds

### Backend (`pongs-shipping-api`)
- **Runtime**: Node.js with Express.js 5.1.0
- **Database**: PostgreSQL with native pg driver
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 with presigned URLs for secure access
- **Email Service**: Nodemailer for automated notifications
- **File Uploads**: Multer with S3 integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **AWS Account** (for S3 storage)
- **SMTP Email Service** (Gmail, etc.)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/pongs-shipping-company.git
cd pongs-shipping-company
```

### 2. Backend Setup

```bash
cd pongs-shipping-api

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Environment Configuration

Create a `.env` file in the `pongs-shipping-api` directory:

```env
# Database Configuration
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=pongs-shipping-company
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
BCRYPT_SALT_ROUNDS=12
JWT_EXPIRES_IN=1h

# Server Configuration
NODE_ENV=development
PORT=3000

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-aws-region
AWS_S3_BUCKET_NAME=your-bucket-name
```

### 3. Database Setup

```bash
# Connect to PostgreSQL and create database
psql -U postgres
CREATE DATABASE "pongs-shipping-company";

# Run database migrations (if available)
# npm run migrate
```

### 4. Frontend Setup

```bash
cd ../pongs-shipping

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000/api" > .env
```

### 5. AWS S3 Setup

1. Create an S3 bucket in your AWS console
2. Configure bucket permissions for file uploads
3. Create IAM user with S3 access permissions
4. Add credentials to your `.env` file

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd pongs-shipping-api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd pongs-shipping
npm run dev
```

### Production Mode

**Backend:**
```bash
cd pongs-shipping-api
npm start
```

**Frontend:**
```bash
cd pongs-shipping
npm run build
npm run preview
```

## 📱 Features & Functionality

### 👤 Customer Features

- **📦 Package Tracking**: Real-time tracking with detailed status updates
- **📋 Pre-Alert Management**: Create, edit, and manage shipping pre-alerts
- **📄 Receipt Upload**: Secure receipt storage with S3 integration
- **👤 Profile Management**: Update personal information and shipping preferences
- **📧 Email Notifications**: Automatic updates on package status changes

### 🛠️ Admin Features

- **📊 Dashboard Overview**: Comprehensive view of all packages and customers
- **👥 Customer Management**: Full customer profile and package history
- **📦 Package Management**: Create, update, and track all packages
- **🚚 Transfer Lists**: Manage package transfers and check-offs
- **📧 Notification System**: Send automated and manual customer notifications
- **🗑️ Package Operations**: Full CRUD operations with confirmation dialogs

### 🎨 UI/UX Features

- **📱 Responsive Design**: Optimized for mobile, tablet, and desktop
- **🎨 Modern Interface**: Clean, professional design with intuitive navigation
- **⚡ Fast Performance**: Optimized loading and smooth interactions
- **🔄 Real-time Updates**: Live status updates and notifications
- **✅ Form Validation**: Comprehensive client and server-side validation

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Packages
- `GET /api/packages` - Get all packages (admin)
- `GET /api/packages/my-packages` - Get user packages
- `GET /api/packages/:id` - Get package by ID
- `POST /api/packages` - Create new package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package
- `PATCH /api/packages/:id/status` - Update package status

### Pre-alerts
- `GET /api/prealerts/my-prealerts` - Get user pre-alerts
- `POST /api/prealerts` - Create pre-alert
- `PUT /api/prealerts/:id` - Update pre-alert
- `DELETE /api/prealerts/:id` - Delete pre-alert
- `GET /api/prealerts/:id/receipt` - Download receipt

### Transfers
- `GET /api/transfers` - Get all transfers
- `POST /api/transfers` - Create transfer list
- `PATCH /api/transfers/:id/status` - Update transfer status

## 🧪 Testing

```bash
# Frontend tests
cd pongs-shipping
npm run test

# Backend tests
cd pongs-shipping-api
npm run test

# Linting
npm run lint
```

## 📦 Deployment

### Frontend Deployment (Vercel/Netlify)

```bash
cd pongs-shipping
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment (Heroku/AWS/DigitalOcean)

```bash
cd pongs-shipping-api
# Set environment variables in your hosting platform
# Deploy with your preferred method
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** in the GitHub repository
3. **Create a new issue** with detailed information
4. **Contact support** at reuelrichards1@gmail.com

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **AWS** for reliable cloud storage
- **PostgreSQL** for robust database management
- **All contributors** who helped make this project possible

---

<div align="center">

**Built with ❤️ by Reuel's Web Services**

[Website](https://reufolio.com) • [Support](mailto:reuelrichards1@gmail.com)

</div>