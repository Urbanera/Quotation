# Architecture Overview

## Overview

DesignQuotes is a full-stack web application for interior design businesses to manage customers, quotations, sales orders, payments, and invoices. The application follows a modern React frontend with an Express.js backend architecture, using PostgreSQL (via Drizzle ORM) for data persistence.

## System Architecture

The application follows a client-server architecture with clear separation between frontend and backend components:

### Frontend (Client)

- Built with React and TypeScript
- Uses a component-based architecture with Shadcn UI components
- State management via React Query for server state
- Routing with Wouter (lightweight alternative to React Router)
- PDF generation capabilities with @react-pdf/renderer
- Styling with Tailwind CSS and theme customization

### Backend (Server)

- Node.js with Express.js
- TypeScript for type safety
- RESTful API architecture
- Drizzle ORM for database interaction
- File uploads handled via Multer

### Data Layer

- PostgreSQL database (via Neon Serverless)
- Drizzle ORM for schema definition and database queries
- Zod for schema validation

## Key Components

### Frontend Components

1. **Layout Components**
   - MainLayout: Provides consistent layout structure for the application
   - Various UI components from Shadcn UI library

2. **Page Components**
   - Customer management pages
   - Quotation creation and management
   - Sales order processing
   - Payment tracking
   - Invoice generation
   - Settings management

3. **Utility Components**
   - PDF rendering components for quotations and invoices
   - Form components with validation
   - Data visualization components

### Backend Components

1. **API Routes**
   - Customer routes
   - Quotation routes
   - Sales order routes
   - Payment routes
   - Invoice routes
   - Accessory catalog routes
   - Settings routes

2. **Storage Layer**
   - Database abstraction through an IStorage interface
   - Implementation using Drizzle ORM

3. **Middleware**
   - Request validation using Zod schemas
   - File upload handling with Multer
   - Error handling middleware

### Data Models

The application uses a comprehensive data model defined with Drizzle ORM and Zod for validation:

1. **Company and App Settings**
   - Company information
   - Default quotation settings

2. **Customer Management**
   - Customer information
   - Follow-up tracking
   - Customer stage tracking

3. **Quotation System**
   - Quotations with multiple rooms
   - Products and accessories within rooms
   - Pricing and discount calculations

4. **Sales Orders**
   - Conversion from quotations to orders
   - Order status tracking
   - Payment status tracking

5. **Payment Processing**
   - Customer payments
   - Payment receipts
   - Payment tracking

6. **Invoice Management**
   - Invoice generation
   - Invoice status tracking

7. **Accessory Catalog**
   - Management of available accessories
   - CSV import functionality

## Data Flow

### Quotation Creation Flow

1. User selects a customer or creates a new one
2. User creates a new quotation for the customer
3. User adds rooms to the quotation
4. User adds products and accessories to each room
5. System calculates pricing, including discounts and taxes
6. User can generate PDF quotations for client presentation
7. User can convert approved quotations to sales orders

### Sales Order Flow

1. Sales orders are created from approved quotations
2. Orders can be tracked through various statuses
3. Payments can be recorded against orders
4. Invoices can be generated from orders

### Payment Flow

1. Payments can be recorded for customers
2. System generates payment receipts
3. Payment history is tracked and can be viewed per customer

## External Dependencies

### Frontend Dependencies

- **UI Components**:
  - Radix UI: Low-level UI primitives
  - Shadcn UI: Higher-level components built on Radix
  - Lucide Icons: Icon library

- **State Management**:
  - TanStack Query: Server state management and data fetching

- **Form Handling**:
  - React Hook Form: Form state management
  - Zod: Schema validation

- **Document Generation**:
  - React PDF: PDF generation for quotations and invoices

- **Date Handling**:
  - date-fns: Date formatting and manipulation

### Backend Dependencies

- **API Framework**:
  - Express.js: Web framework

- **Database**:
  - Drizzle ORM: Database query builder and schema definition
  - @neondatabase/serverless: PostgreSQL database driver

- **File Handling**:
  - Multer: File upload handling

## Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

1. **Development**:
   - Vite development server for the frontend
   - Express server for the backend
   - Hot module replacement for rapid development

2. **Production Build**:
   - Frontend built with Vite
   - Backend bundled with esbuild
   - All assets served from the Express server

3. **Database**:
   - Uses Neon Serverless PostgreSQL, connected via environment variables

4. **Environment Configuration**:
   - Different configurations for development and production environments
   - Environment variables for database connection and other settings

## Authentication and Authorization

The application includes user management with different roles:
- Admin: Full access to all features
- Manager: Access to manage quotations, orders, and customers
- Designer: Limited access to create quotations
- Viewer: Read-only access

Users are organized into teams for collaborative work, with team members having specific access levels within the team context.

## Future Considerations

1. **Real-time Notifications**:
   - The application could benefit from real-time notifications for follow-ups and status changes

2. **Integration with Design Tools**:
   - Potential integration with design software for importing product specifications

3. **Mobile Application**:
   - The current design is responsive but a dedicated mobile app could enhance field usage

4. **Advanced Analytics**:
   - Expanded analytics for sales forecasting and business intelligence