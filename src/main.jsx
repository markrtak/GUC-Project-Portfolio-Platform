/**
 * main.jsx — React application entry point
 *
 * PURPOSE:
 *   The very first JavaScript file that runs when the page loads.
 *   It mounts the entire React application into the #root <div> in index.html.
 *
 * WHAT HAPPENS HERE (in order):
 *   1. Global CSS (Tailwind directives + custom base styles) is imported.
 *      Vite processes this through PostCSS → Tailwind → autoprefixer.
 *
 *   2. ReactDOM.createRoot()  — Creates a React root, the entry point for
 *      React 18's concurrent rendering architecture. This replaces the older
 *      ReactDOM.render() API and enables features like automatic batching
 *      and Suspense-based data fetching.
 *
 *   3. root.render()  — Renders the provider/router tree into the root.
 *
 * PROVIDER HIERARCHY:
 *   <StrictMode>     — Enables extra React development warnings. Double-invokes
 *                      lifecycle methods to surface side-effect bugs. Has no
 *                      effect in production builds.
 *
 *   <BrowserRouter>  — Provides the routing context (history object, location,
 *                      etc.) to every component in the tree via React Context.
 *                      Must wrap <App> so that <Routes>, <Link>, useNavigate(),
 *                      etc. work correctly.
 *
 *   <AuthProvider>   — Provides the authentication state (currentUser, login,
 *                      logout, register) to every component.
 *
 *   <DataProvider>   — Provides the simulated data layer (projects, users,
 *                      courses, and all CRUD operations) to every component.
 *
 *   <App>            — The route tree; renders the correct page component for
 *                      the current URL.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import '@/assets/global.css';

import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <App />
          <Toaster richColors position="top-right" theme="dark" closeButton />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
