# DesignQuotes - Interior Design Quotation Management

## Overview

DesignQuotes is a full-stack web application for interior design businesses to manage customers, quotations, sales orders, payments, and invoices. The application provides a complete business management solution with features for customer relationship management, quotation generation, order processing, and financial tracking.

## Recent Updates (July 21, 2025)

### Latest Fixes Completed (July 21, 2025 - Session 2)
- **✅ RESOLVED: Image Update Functionality**: Fixed missing updateImage method in database storage
  - Implemented proper database storage method for updating image types and metadata
  - Fixed storage-migrator routing to use database storage instead of memory for all image operations
  - **Result**: Image type updates (e.g., "OTHER" → "TOP VIEW 3D") now work correctly and persist in database
- **✅ RESOLVED: PDF Image Display Issues**: Fixed critical quotation details loading for PDF generation
  - Enhanced `getQuotationWithDetails` method to properly fetch images from database instead of returning empty arrays
  - Fixed both landscape and presentation PDF image display functionality
  - **Result**: PDFs now properly display uploaded images in rooms instead of showing blank spaces
- **✅ RESOLVED: Landscape PDF Terms & Conditions Formatting**: Replaced raw HTML display with professional multi-column layout
  - Implemented structured 6-section layout: Project Scope & Delivery, Payment & Pricing, Quality & Warranty, Modifications & Changes, Client Responsibilities, Cancellation Policy
  - Added styled note section with blue background matching preview expectations
  - **Result**: Terms & conditions now display in clean, professional format matching user's preview image
- **✅ RESOLVED: CSV Customer Import Multi-line Field Handling**: Fixed CSV parsing to handle addresses with line breaks
  - Implemented proper CSV parser that handles multi-line quoted fields (addresses like "Survey no:331-41\nSivaram village")
  - Enhanced field cleaning and validation to properly process quoted values
  - **Result**: CSV import now successfully imports all customers including those with complex multi-line addresses
- **✅ RESOLVED: Quotation Duplication Failure**: Implemented missing database storage method for quotation duplication
  - Created complete `duplicateQuotation` method in database storage with proper quotation number generation
  - Added full duplication of rooms, products, accessories, images, and installation charges
  - Enhanced error handling and logging for duplication process
  - **Result**: Quotation duplication now works for both same customer and different customer scenarios

### Critical Fixes Completed (July 21, 2025 - Session 1)
- **✅ RESOLVED: Room Price Calculation Issue**: Fixed critical room pricing system where rooms displayed 0 prices despite having products/accessories with correct values
  - Implemented missing `updateQuotationPrices` method in database storage to properly aggregate product and accessory prices at room level
  - Added automatic price recalculation triggers to product/accessory creation routes
  - Fixed database schema field naming conflicts and established production-ready price calculation system
  - **Result**: Room prices now display correct values (e.g., 23000/18000) instead of 0/0 with full PostgreSQL persistence
- **✅ RESOLVED: Sales Order Conversion Failure**: Fixed database date handling error preventing quotation-to-sales-order conversion
  - Fixed `value.toISOString is not a function` error in sales order creation by properly handling date fields
  - Enhanced `createSalesOrderFromQuotation` method with safe date object handling and selective field insertion
  - **Result**: Sales orders now convert successfully with proper order numbers (SO-2025-003) and correct amounts
- **✅ RESOLVED: Invoice Editing Functionality**: Implemented complete invoice editing system with smart number management
  - Created edit form with invoice number, status, due date, and notes editing capabilities
  - Fixed API request errors and null reference issues in edit components
  - Enhanced invoice number generation to properly handle edited numbers (e.g., INV-2025-09 → next invoice INV-2025-010)
  - Added proper form pre-population and authentication for all invoice edit operations
- **✅ RESOLVED: PDF Generation Issues**: Fixed presentation quote blank page and landscape image margins
  - Removed extra blank page in presentation quotes by integrating Terms & Conditions into summary page
  - Increased bottom margin in landscape PDF images from 40px to 60px to prevent footer overlap
  - Corrected page numbering calculations to eliminate unnecessary pages

## Previous Updates (July 19, 2025)

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
- **Database Migration Complete**: ✅ **MAJOR MILESTONE**: Successfully migrated ALL modules from in-memory storage to PostgreSQL database
  - All 19 modules now use database storage for permanent data persistence
  - Fixed SQL syntax errors in follow-ups module with proper field mapping
  - Enhanced quotation number auto-generation in database storage
  - Implemented comprehensive sales order database operations
  - Removed temporary quotation restoration since data now persists in database
- **Cache Invalidation**: Fixed customer data display issues with proper React Query cache management
- **Mutation Optimization**: Converted customer creation to useMutation for better error handling and immediate cache updates
- **Authentication Validation**: Enhanced token validation on app refresh and new device access
- **Data Persistence**: ✅ **RESOLVED**: All business data now permanently stored in PostgreSQL with full CRUD operations

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