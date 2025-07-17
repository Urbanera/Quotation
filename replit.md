# DesignQuotes - Interior Design Quotation Management

## Overview

DesignQuotes is a full-stack web application for interior design businesses to manage customers, quotations, sales orders, payments, and invoices. The application provides a complete business management solution with features for customer relationship management, quotation generation, order processing, and financial tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
- **Frontend**: React 18 with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (via Neon Serverless)
- **ORM**: Drizzle ORM for database operations
- **Build Tool**: Vite for frontend bundling
- **Deployment**: Single-server deployment with static file serving

### Technology Stack
- **Frontend Framework**: React with TypeScript
- **UI Components**: Radix UI with Shadcn/ui component library
- **Styling**: Tailwind CSS with custom theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter (lightweight React router)
- **Forms**: React Hook Form with Zod validation
- **PDF Generation**: React-PDF renderer for documents
- **File Uploads**: Multer for server-side file handling

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon Serverless for cloud PostgreSQL
- **Schema**: Centralized schema definition in `/shared/schema.ts`
- **Migrations**: Database migrations managed through Drizzle Kit

### Backend Architecture
- **API Structure**: RESTful API with Express.js
- **Storage Layer**: Abstract storage interface (`IStorage`) for data operations
- **File Management**: Multer for image uploads and file handling
- **Email Service**: Nodemailer integration for email communications
- **WhatsApp Integration**: WhatsApp Business API for customer communication

### Frontend Architecture
- **Component Structure**: Modular component architecture with feature-based organization
- **Layout System**: MainLayout with Sidebar and Topbar for consistent navigation
- **Form Handling**: React Hook Form with Zod schema validation
- **Data Fetching**: TanStack Query for server state management and caching
- **PDF Generation**: React-PDF for quotation and invoice generation
- **Theme System**: Replit theme plugin integration with Tailwind CSS

## Data Flow

### Customer Management
1. Customer creation/editing through form validation
2. Customer stage tracking (new, pipeline, cold, warm, booked, lost)
3. Follow-up scheduling and management
4. Floor plan upload and management
5. Customer ledger tracking for financial overview

### Quotation Process
1. Customer selection and project details input
2. Room-based quotation structure with products and accessories
3. Image upload for visualization
4. Installation charge calculation
5. PDF generation in multiple formats (basic, presentation, landscape)
6. Quotation approval and conversion to sales orders

### Order Management
1. Sales order creation from approved quotations
2. Milestone tracking for project progress
3. Payment tracking and receipt generation
4. Invoice generation and management
5. Order status updates throughout lifecycle

### Communication System
1. Email integration for document delivery
2. WhatsApp Business API for customer communication
3. Template-based messaging system
4. Document sharing through communication channels

## External Dependencies

### Database
- **Neon Serverless**: PostgreSQL cloud database
- **Drizzle ORM**: Type-safe database operations

### UI Components
- **Radix UI**: Accessible component primitives
- **Shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework

### File Processing
- **Multer**: File upload handling
- **React-PDF**: PDF document generation
- **html2canvas**: HTML to image conversion

### Communication Services
- **Nodemailer**: Email service integration
- **WhatsApp Business API**: Customer messaging
- **SendGrid**: Email delivery service (optional)

### Payment Processing
- **Stripe**: Payment gateway integration (components included)

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **API Server**: Express.js with TypeScript compilation via tsx
- **Database**: Development connection to Neon Serverless

### Production Build
- **Frontend**: Vite build outputs to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Assets**: Static file serving through Express.js
- **Environment**: Production configuration with optimized builds

### Configuration Requirements
- **DATABASE_URL**: PostgreSQL connection string
- **Email Settings**: SMTP configuration for email services
- **WhatsApp Settings**: Business API credentials
- **File Storage**: Upload directory configuration

### Key Features
- **Multi-format Quotations**: Basic, presentation, and landscape PDF formats
- **Customer Pipeline**: Stage-based customer management
- **Financial Tracking**: Comprehensive payment and invoice management
- **Communication Integration**: Email and WhatsApp messaging
- **File Management**: Floor plan and project image handling
- **Responsive Design**: Mobile-friendly interface with adaptive layout
- **Print Optimization**: Specialized print styles for documents