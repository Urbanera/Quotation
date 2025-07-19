# Production Deployment Guide

## Current Status
The project is configured for production deployment but requires configuration changes that must be made manually through the Replit interface.

## Deployment Issues and Solutions

### 1. Security Block: Run command contains 'dev'
**Issue**: The `.replit` file is currently set to run `npm run dev` which is blocked for production deployments.

**Solution**: Update the `.replit` file manually through the Replit interface:
- Change `run = "npm run dev"` to `run = "npm start"`
- Change `run = ["sh", "-c", "npm run dev"]` to `run = ["sh", "-c", "npm start"]` in the `[deployment]` section

### 2. Production Build Configuration
**Status**: ✅ READY - The project already has proper production scripts configured:
- `npm run build`: Builds both frontend (Vite) and backend (esbuild)
- `npm start`: Starts the production server with NODE_ENV=production

### 3. Build Process Verification
**Status**: ✅ TESTED - The build process works correctly:
- Frontend builds to `dist/public/` directory
- Backend builds to `dist/index.js`
- Production server serves static files from `dist/public/`

### 4. Required Manual Configuration Changes

To deploy this application to production, you need to manually update the `.replit` file:

```toml
# Change this line:
run = "npm run dev"
# To:
run = "npm start"

# And in the [deployment] section, change:
run = ["sh", "-c", "npm run dev"]
# To:
run = ["sh", "-c", "npm start"]
```

### 5. Deployment Process

1. **Manual Configuration** (Required):
   - Edit `.replit` file as described above
   - Ensure the deployment section uses production commands

2. **Build Process** (Automatic):
   - The build command will run automatically during deployment
   - Frontend assets will be generated in `dist/public/`
   - Backend will be bundled to `dist/index.js`

3. **Production Server**:
   - Serves on port 5000 (configured correctly)
   - Uses `0.0.0.0` host binding (configured correctly)
   - Serves static files from `dist/public/` in production mode
   - API routes handled by Express backend

### 6. Environment Configuration

**Status**: ✅ CONFIGURED - The application correctly detects environment:
- Development: Uses Vite dev server with HMR
- Production: Serves static files from dist directory
- Environment detection: `app.get("env") === "development"`

### 7. Database Configuration

**Status**: ✅ READY - Database is configured for production:
- Uses environment variable `DATABASE_URL`
- PostgreSQL connection already established
- No additional configuration needed

## Quick Deployment Checklist

- [x] Production build scripts configured
- [x] Static file serving configured
- [x] Environment detection working
- [x] Database connection configured
- [x] Port configuration (5000) set correctly
- [ ] Manual update of `.replit` file (requires user action)

## Alternative Deployment Script

If you prefer to test the production build locally first, you can use:

```bash
# Build and start production server
./start-production.sh
```

This script will:
1. Run `npm run build` to create production assets
2. Run `npm start` to start the production server

## Notes

- The application is fully ready for production deployment
- Only the `.replit` configuration needs manual updates
- All build processes and production configurations are in place
- The production server will correctly serve both API and static assets