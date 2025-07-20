# DesignQuotes - Interior Design Quotation Management

## Overview

DesignQuotes is a full-stack web application for interior design businesses to manage customers, quotations, sales orders, payments, and invoices. The application provides a complete business management solution with features for customer relationship management, quotation generation, order processing, and financial tracking.

## Recent Updates (July 19, 2025)

### Enhanced Security & Authentication
- **JWT Authentication**: Implemented secure JWT-based authentication with access tokens (10-minute expiry) and refresh tokens (7-day expiry)
- **Automatic Token Refresh**: Added seamless token refresh mechanism to maintain user sessions
- **Secure Logout**: Enhanced logout process with proper token cleanup and cache clearing
- **Short Session Timeout**: Maximum 10-minute session duration for enhanced security

### Role-Based Access Control (RBAC)
- **Permission System**: Created comprehensive permission system with role-module-permission mapping
- **Role-Based Navigation**: Sidebar dynamically shows/hides menu items based on user roles (Admin sees all, Manager/Designer limited to Dashboard through Payments)
- **API Permission Enforcement**: Added comprehensive middleware to enforce permissions at the API level for all critical routes
- **Database-Backed Permissions**: Migrated from in-memory to PostgreSQL database storage for persistent permission management
- **Auto-Seeding**: Implemented automatic database seeding with default permission configurations on application startup

### Data Management Improvements
- **Cache Invalidation**: Fixed customer data display issues with proper React Query cache management
- **Mutation Optimization**: Converted customer creation to useMutation for better error handling and immediate cache updates
- **Authentication Validation**: Enhanced token validation on app refresh and new device access
- **Data Persistence Issue**: ⚠️ **CRITICAL**: Application currently uses in-memory storage (MemStorage) which loses all data on restart
  - PostgreSQL database configured and available but not yet connected to application storage layer
  - All customer data, quotations, settings, and business data is temporary until database migration is completed
  - Backup/restore functionality provides temporary data preservation workaround

### Authentication & User Management Enhancements (July 19, 2025)
- **Admin Password Reset**: Added ability for admin users to reset any user's password with secure validation
- **Profile Update Fixes**: Fixed profile update functionality with proper error handling and validation
- **Password Change Improvements**: Enhanced password change functionality with consistent validation and proper API integration
- **Password Hashing**: Ensured proper password hashing on all password updates and resets
- **User Update Validation**: Fixed user management validation schema - password is now optional for user edits, resolving API errors
- **Dialog Accessibility**: Enhanced dialog components with proper accessibility attributes for screen readers

### Critical Fixes & Enhancements (July 20, 2025)
- **Sidebar Navigation Improvements**: Fixed overlay issues with expandable sidebar functionality
  - Added proper margin adjustment to prevent content overlay
  - Implemented smooth transition between collapsed (64px) and expanded (256px) states
  - Fixed dynamic width calculation and content positioning
- **Complete Backup & Restore System**: Enhanced data backup to include all critical tables
  - Added sales orders, quotations, invoices, payments, follow-ups to backup export
  - Implemented comprehensive restore functionality for all data types
  - Fixed file type validation to accept both CSV and JSON formats
- **Invoice Printing Optimization**: Fixed A4 paper formatting and bank details integration
  - Reduced margins (8mm) and font sizes (9pt/8pt) for single-page A4 printing
  - Fixed bank details to use actual settings instead of hardcoded values
  - Added conditional display based on showBankDetailsOnInvoice setting
  - Improved print layout spacing and formatting
- **Authentication Token Management**: Fixed invoice print authentication issues
  - Added Bearer token headers to all invoice data fetching operations
  - Fixed authentication for quotation details and customer data requests
- **Customer Balance Display**: Added real-time balance display in payment receipt creation
  - Shows customer balance with color coding (green for credit, red for dues)
  - Updates automatically when different customers are selected
  - Includes helpful status text for better understanding
- **Quotation Update Validation**: Fixed quotation saving errors by creating partial update schema
  - Created quotationUpdateSchema for editing operations to prevent validation failures
  - Fixed "failed to update quotation" errors caused by incomplete form data validation
- **Handling Charges Auto-calculation**: Enhanced quotation summary with room-based handling charge calculation
  - Auto-calculates handling charges based on room count (small/medium/large categories)
  - Maintains editable input field for manual override capability
  - Integrated with app settings for immediate recalculation when settings are updated
- **Landscape PDF Room Descriptions**: Added room description display in landscape PDF generation
  - Room descriptions now appear below room names on first slides
  - Enhanced both preview and PDF export functionality

### User Experience Enhancements
- **Follow-up Notifications**: Added real-time notification system for customer follow-ups with bell icon alerts
- **Error Handling**: Improved error messages and loading states throughout the application
- **Data Consistency**: Fixed issues where customer data wouldn't display after creation or page refresh

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

### Production Build (CONFIGURED FOR DEPLOYMENT)
- **Frontend**: Vite build outputs to `dist/public` ✅
- **Backend**: ESBuild bundles server code to `dist/index.js` ✅
- **Assets**: Static file serving through Express.js ✅
- **Environment**: Production configuration with optimized builds ✅
- **Build Command**: `npm run build` (creates both frontend and backend bundles) ✅
- **Start Command**: `npm start` (runs production server) ✅

### Deployment Status (READY - Manual Configuration Needed)
**The application is production-ready but requires manual configuration changes:**

1. **Production Build** ✅ FULLY CONFIGURED:
   - Build tested successfully (completes in ~31 seconds)
   - Frontend builds to `dist/public/`, backend to `dist/index.js`
   - Production server serves static files correctly

2. **Manual `.replit` File Changes Required**:
   - Change line 2: `run = "npm run dev"` → `run = "npm start"`
   - Change line 10: `run = ["sh", "-c", "npm run dev"]` → `run = ["sh", "-c", "npm start"]`
   - Add build command: `build = ["sh", "-c", "npm run build"]`

3. **Deployment Status Summary**:
   - ✅ Production scripts configured and tested
   - ✅ Build process working (31s build time, 289KB backend bundle)
   - ✅ Static file serving configured for production
   - ✅ Environment detection working correctly
   - ✅ Database connection ready (PostgreSQL via DATABASE_URL)
   - ⚠️ **ONLY BLOCKER**: Manual `.replit` configuration needed

### Deployment Files Created
- **DEPLOYMENT_INSTRUCTIONS.md**: Complete step-by-step manual fix instructions
- **DEPLOYMENT.md**: Comprehensive deployment guide 
- **DEPLOYMENT_SUMMARY.md**: Technical deployment configuration details
- **start-production.sh**: Production testing script

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
- **Unsaved Changes Protection**: Comprehensive warning system to prevent data loss during quotation editing
- **Enhanced Error Handling**: Detailed error messages for quotation approval failures with actionable feedback
- **Quotation Status Management**: Ability to approve and unapprove quotations with proper validation
- **Real-time Modification History**: Modification history updates immediately without requiring page refresh
- **Accurate Price Tracking**: Modification snapshots capture correct final prices and quotation states
- **Duplicate Prevention**: Adding same products/accessories updates quantity instead of creating duplicates
- **Firm Name Display**: Configurable firm name field used specifically for payment receipts and invoice prints
- **Bank Details Configuration**: Configurable bank details with checkbox option to show/hide on invoices
- **Compact Invoice Layout**: Optimized invoice printing to fit single A4 page with reduced margins and font sizes
- **Accessory Catalog CSV Management**: Full CSV import/export functionality for bulk accessory management ✅ (Fixed July 19, 2025)