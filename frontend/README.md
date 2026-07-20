# The Essence - Frontend

React-based frontend for The Essence Journal & Publications Management System.

## Tech Stack

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_API_BASE_URL=http://localhost:8000
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── config/          # Configuration files (API setup)
│   ├── layouts/         # Layout components
│   ├── routes/          # Route definitions
│   ├── services/        # API service modules
│   ├── views/           # Page components
│   │   ├── admin/       # Admin pages
│   │   ├── author/      # Author pages
│   │   ├── public/      # Public pages
│   │   └── reviewer/    # Reviewer pages
│   ├── App.jsx          # Root component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Features Implemented

### Task 14.1 - React Project Setup
- ✅ Vite configuration with React
- ✅ React Router v6 setup
- ✅ Directory structure
- ✅ Axios configuration with interceptors
- ✅ Environment variables

### Task 14.2 - Authentication Service
- ✅ Login function
- ✅ Logout function
- ✅ Token refresh logic
- ✅ Axios interceptors for automatic token refresh
- ✅ User session management (localStorage)
- ✅ Role checking utilities

### Task 14.3 - Protected Routes
- ✅ ProtectedRoute component
- ✅ Authentication guard
- ✅ Role-based access control
- ✅ Automatic redirect to login for unauthenticated users
- ✅ Role-based dashboard redirects

## Authentication Flow

1. User logs in via `/login`
2. Backend sets HTTP-only cookies (access_token, refresh_token)
3. User data stored in localStorage
4. Axios interceptor automatically includes cookies in requests
5. On 401 error, interceptor attempts token refresh
6. If refresh fails, user redirected to login

## Route Protection

Routes are protected using the `ProtectedRoute` component:

```jsx
<Route
  path="/author/*"
  element={
    <ProtectedRoute allowedRoles={['author']}>
      <AuthorDashboard />
    </ProtectedRoute>
  }
/>
```

## API Configuration

The API client is configured in `src/config/api.js`:
- Base URL from environment variables
- Cookie-based authentication
- Automatic token refresh on 401
- Request/response interceptors

## Next Steps

- Task 15: Implement public pages
- Task 16: Implement author dashboard and workflows
- Task 17: Implement reviewer dashboard and workflows
- Task 18: Implement admin dashboard and workflows
