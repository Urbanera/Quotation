# Architecture Overview

## 1. Overview

DesignQuotes is a full-stack application built for interior design businesses to manage quotations, customers, sales orders, payments, and invoices. The application follows a modern web architecture with a clear separation between client and server components, using TypeScript throughout the codebase for type safety.

## 2. System Architecture

The application follows a client-server architecture with the following key components:

### 2.1 Frontend (Client)

- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query for server state management
- **UI Components**: Custom components built with Radix UI primitives and styled with Tailwind CSS
- **Theme**: Customizable theming based on a theme.json configuration and Shadcn UI components

### 2.2 Backend (Server)

- **Framework**: Express.js with TypeScript
- **API**: RESTful API endpoints to handle all business logic
- **Database Access**: Drizzle ORM with Neon serverless PostgreSQL
- **File Storage**: Local file system for uploads (with potential for expansion)

### 2.3 Database

- **Type**: PostgreSQL (via Neon serverless database)
- **ORM**: Drizzle for schema definition and database access
- **Schema Validation**: Zod for schema validation and type generation

## 3. Key Components

### 3.1 Frontend Components

#### 3.1.1 Page Structure

The frontend is organized into feature-based pages with shared components:

- **Dashboard**: Overview of business metrics and pending follow-ups
- **Customers**: Customer management with follow-up tracking
- **Quotations**: Create, edit, and manage interior design quotations
- **Sales Orders**: Convert quotations to sales orders and track fulfillment
- **Payments**: Manage customer payments and receipts
- **Invoices**: Generate and manage customer invoices
- **Accessories**: Manage accessory catalog for interior design components
- **Settings**: Company profile and application settings

#### 3.1.2 UI Component Library

The application uses a comprehensive UI component library built with:

- **Radix UI**: For accessible, unstyled primitives
- **Tailwind CSS**: For styling and responsive design
- **Shadcn UI**: Theme integration for consistent look and feel

#### 3.1.3 PDF Generation

The application includes both client-side and server-side PDF generation:

- **Client-side**: Using jsPDF and html2canvas for on-demand PDF generation
- **Server-side**: Using PDFKit for more complex document generation

### 3.2 Backend Components

#### 3.2.1 API Routes

The backend exposes several RESTful API endpoints organized around business entities:

- `/api/customers`: Customer management
- `/api/quotations`: Quotation management
- `/api/sales-orders`: Sales order processing
- `/api/customer-payments`: Payment tracking
- `/api/invoices`: Invoice generation and management
- `/api/accessory-catalog`: Catalog management
- `/api/users` and `/api/teams`: User and team management
- `/api/settings`: Application settings

#### 3.2.2 Data Storage

The application uses a structured approach to data storage:

- **Database**: PostgreSQL for structured data storage
- **File Storage**: Local file system for document uploads

#### 3.2.3 Storage Service

The backend implements a storage service interface that abstracts database operations, making it easier to:

- Maintain consistent data access patterns
- Implement business logic validation
- Ensure proper relationship handling between entities

## 4. Data Flow

### 4.1 Client-Server Communication

1. **Data Fetching**: React Query is used for data fetching, caching, and state management
2. **API Requests**: Standardized fetch requests with error handling
3. **Response Handling**: Type-safe response handling with TypeScript

### 4.2 Business Workflows

#### 4.2.1 Quotation to Sales Order Flow

1. Create customer record
2. Create quotation with rooms, products, and accessories
3. Get customer approval
4. Convert quotation to sales order
5. Track order fulfillment and collect payments
6. Generate invoices and receipts

#### 4.2.2 Customer Management Flow

1. Add customer information
2. Schedule follow-ups with reminders
3. Track customer stage (new, pipeline, warm, etc.)
4. Convert prospects to paying customers

## 5. External Dependencies

### 5.1 Frontend Dependencies

- **@radix-ui**: Component primitives for building accessible UI
- **@tanstack/react-query**: Data fetching and state management
- **@react-pdf/renderer**: PDF generation for documents
- **jspdf & html2canvas**: Client-side PDF generation
- **date-fns**: Date formatting and manipulation
- **tailwindcss**: Utility-first CSS framework

### 5.2 Backend Dependencies

- **express**: Web framework for Node.js
- **drizzle-orm**: Database ORM for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **zod**: Schema validation
- **multer**: File upload handling
- **pdfkit**: PDF generation

### 5.3 Development Tools

- **vite**: Frontend build tool
- **typescript**: Type safety throughout the codebase
- **esbuild**: JavaScript bundler for the server
- **drizzle-kit**: Database migration and schema management

## 6. Deployment Strategy

### 6.1 Deployment Configuration

The application is configured for deployment on Replit with:

- **build**: `vite build && esbuild` to build both client and server
- **start**: `node dist/index.js` to run the production server
- **dev**: Development mode with hot reloading

### 6.2 Environment Setup

- **Database**: Neon serverless PostgreSQL connected via environment variables
- **Static Assets**: Served from the server's public directory
- **API**: Both API endpoints and frontend served from the same server

### 6.3 Production Considerations

- **Database Migrations**: Managed via Drizzle Kit
- **Asset Optimization**: Vite handles asset optimization for production
- **Error Handling**: Runtime error overlays in development, graceful error handling in production

## 7. Data Schema

The application uses a comprehensive data schema including:

- **Customers**: Customer information and status tracking
- **Quotations**: Detailed quotation structure with nested components
- **Rooms**: Rooms associated with quotations
- **Products**: Product items in rooms
- **Accessories**: Accessory items in rooms
- **Sales Orders**: Orders derived from approved quotations
- **Payments**: Customer payment records
- **Invoices**: Financial documentation
- **Users & Teams**: User management and team organization
- **Settings**: Application and company configuration

## 8. Future Extensibility

The architecture allows for future extension in several areas:

- **Payment Gateway Integration**: The structure supports adding payment gateway integration
- **Cloud Storage**: File storage could be extended to use cloud providers
- **Mobile Application**: The API-first approach would support mobile app development
- **Reporting & Analytics**: The data schema supports adding reporting capabilities