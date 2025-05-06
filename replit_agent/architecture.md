# Architecture Documentation

## Overview

DesignQuotes is a full-stack web application designed for interior design businesses to manage their quotation and customer lifecycle. The application follows a modern client-server architecture with a React frontend and an Express.js backend, using a PostgreSQL database for data persistence. 

The system enables businesses to manage customers, create and track quotations for interior design projects, convert quotations to sales orders, track payments, and generate invoices. It's designed with a focus on usability and efficiency for interior design business workflows.

## System Architecture

### High-Level Architecture

The application follows a traditional client-server architecture:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│    Client   │◄───►│    Server   │◄───►│  Database   │
│   (React)   │     │  (Express)  │     │ (PostgreSQL)│
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

- **Frontend**: Built with React using TypeScript, enhanced with Tailwind CSS for styling and Shadcn UI components. Uses React Query for data fetching and state management.
- **Backend**: Express.js server using TypeScript, providing RESTful API endpoints.
- **Database**: PostgreSQL database managed through Drizzle ORM, with a well-structured schema for various business entities.

### Development & Deployment

The application is set up to run in different environments:

- **Development**: Uses Vite for frontend development with hot module reloading, and runs the server concurrently.
- **Production**: The frontend is built as static assets served by the Express backend, which also provides the API endpoints.
- **Deployment**: Configured to deploy on Replit with autoscaling support.

## Key Components

### Frontend Components

1. **Page Components**: Organized by feature (e.g., customers, quotations, sales orders, invoices) with separate components for listing, creating, editing, and viewing details.

2. **UI Components**: Uses Shadcn UI components library with Radix UI primitives for consistent look and feel, including:
   - Form components (inputs, selects, buttons)
   - Layout components (cards, tables, dialogs)
   - Feedback components (toasts, alerts)

3. **State Management**: 
   - Uses React Query for server state management (data fetching, caching, updates)
   - Uses React Hook Form for form state management
   - Uses Zod for schema validation on the client side

### Backend Components

1. **API Routes**: Organized RESTful endpoints for different business entities:
   - `/api/customers` - Customer management
   - `/api/quotations` - Quotation creation and management
   - `/api/sales-orders` - Sales order processing
   - `/api/invoices` - Invoice generation and management
   - `/api/payments` - Payment tracking
   - `/api/settings` - Company and application settings

2. **Database Access Layer**: A storage abstraction layer that interfaces with the database through Drizzle ORM, providing CRUD operations for business entities.

3. **Validation Layer**: Uses Zod schemas shared between client and server for consistent data validation.

### Database Schema

The database schema is defined using Drizzle ORM with the following main entities:

1. **Customers**: Stores customer information with stages like "new", "pipeline", "cold", "warm", "booked".
2. **Quotations**: Captures all details related to quotations with their status.
3. **Rooms**: Represents rooms in a quotation, with associated products and accessories.
4. **Products & Accessories**: Details of products and accessories used in quotations.
5. **Sales Orders**: Converted from approved quotations.
6. **Invoices**: Financial documents generated for sales.
7. **Payments**: Records payments from customers.
8. **Settings**: Stores company and application configuration.

## Data Flow

### Main Workflows

1. **Customer Management Flow**:
   - Create/edit customer details
   - Schedule follow-ups for customers
   - Track customer stages (new, pipeline, warm, etc.)

2. **Quotation Creation Flow**:
   - Select a customer
   - Add rooms to the quotation
   - Add products and accessories to each room
   - Calculate costs including discounts and taxes
   - Generate and share quotation documents

3. **Sales Order Flow**:
   - Convert approved quotations to sales orders
   - Track order status (pending, confirmed, in production, etc.)
   - Record and track payments
   - Generate invoices

4. **Financial Flow**:
   - Record payments against sales orders
   - Generate receipts for payments
   - Track payment status (pending, partial, paid)
   - Generate financial reports

### API Interaction Pattern

The application uses a standardized RESTful API pattern:

1. Client makes requests to the server API endpoints
2. Server validates request data using Zod schemas
3. Server performs business logic and database operations
4. Server returns appropriate responses with data or error messages
5. Client updates UI based on response, using React Query for caching and state management

## External Dependencies

### Frontend Dependencies

1. **UI Framework**: 
   - React - Core UI library
   - Radix UI - Accessible UI primitives
   - Shadcn UI - Component system built on Radix
   - Tailwind CSS - Utility-first CSS framework

2. **State Management**:
   - @tanstack/react-query - Server state management
   - react-hook-form - Form state management
   - zod - Schema validation

3. **Routing**:
   - wouter - Lightweight routing library

4. **Document Generation**:
   - @react-pdf/renderer - PDF generation for quotations and invoices

5. **Date Handling**:
   - date-fns - Date manipulation library

### Backend Dependencies

1. **Server Framework**:
   - Express.js - Web server framework

2. **Database**:
   - @neondatabase/serverless - PostgreSQL database client
   - drizzle-orm - ORM for database access

3. **File Handling**:
   - multer - Middleware for handling file uploads

4. **Payment Processing**:
   - @stripe/stripe-js - Stripe integration for payments

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Build Process**:
   - Frontend assets are built using Vite and output to the `dist/public` directory
   - Backend is bundled using esbuild into the `dist` directory

2. **Runtime Environment**:
   - Uses Node.js v20 for the server runtime
   - PostgreSQL v16 for the database

3. **Deployment Target**:
   - Configured for autoscaling on Replit

4. **Environment Configuration**:
   - Database URL is provided via environment variables
   - Development/production modes controlled via NODE_ENV

5. **File Storage**:
   - Local file storage for uploads in the `uploads` directory

## Authentication and Authorization

The system appears to have user accounts with different role levels:
- Admin: Full access to all features
- Manager: Management capabilities
- Designer: Limited to design-related functions
- Viewer: Read-only access

The user and team management components suggest a role-based access control system, although the specific implementation details are not fully visible in the provided code snippets.

## Monitoring and Logging

The server includes basic request logging middleware that captures:
- HTTP method
- Path
- Status code
- Response time
- Response payload (truncated for readability)

This provides a foundation for monitoring API usage and performance.

## Future Considerations

Based on the repository structure, some potential areas for future architectural enhancement might include:

1. **Authentication Improvements**: Implementing more robust authentication mechanisms like OAuth or JWT
2. **Real-time Updates**: Adding WebSocket support for real-time notifications and updates
3. **Caching Strategy**: Implementing server-side caching for frequently accessed data
4. **Microservices**: Potentially splitting the backend into microservices as the application grows
5. **Mobile Support**: Extending the frontend to support mobile applications through responsive design or native apps