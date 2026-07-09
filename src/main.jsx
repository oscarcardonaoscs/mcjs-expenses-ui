// src/main.jsx
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Expenses from "./pages/Expenses.jsx";
import Categories from "./pages/Categories.jsx";
import Vendors from "./pages/Vendors.jsx";
import PaymentAccounts from "./pages/PaymentAccounts.jsx";
import HelpersPage from "./pages/helpers/HelpersPage.jsx";
import HelperTimeEntriesPage from "./pages/helpers/HelperTimeEntriesPage.jsx";
import HelperPayrollPeriodsPage from "./pages/helpers/HelperPayrollPeriodsPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ClientLocationsPage from "./pages/ClientLocationsPage.jsx";
import ClientLocationFormPage from "./pages/ClientLocationFormPage.jsx";

import Login from "./pages/Login.jsx";
import "./index.css";

const qc = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // App será tu Layout
    children: [
      { index: true, element: <Dashboard /> }, // "/" -> Dashboard
      { path: "expenses", element: <Expenses /> },
      { path: "categories", element: <Categories /> },
      { path: "vendors", element: <Vendors /> },
      { path: "payment-accounts", element: <PaymentAccounts /> },
      { path: "helpers", element: <HelpersPage /> },
      { path: "helper-time-entries", element: <HelperTimeEntriesPage /> },
      { path: "helper-payroll-periods", element: <HelperPayrollPeriodsPage /> },
      { path: "clients", element: <ClientsPage /> },
      { path: "clients/:clientId/locations", element: <ClientLocationsPage /> },
      {
        path: "clients/:clientId/locations/new",
        element: <ClientLocationFormPage />,
      },
      {
        path: "clients/:clientId/locations/:locationId/edit",
        element: <ClientLocationFormPage />,
      },

      { path: "login", element: <Login /> },
      // opcional: si quieres que /dashboard también funcione
      { path: "dashboard", element: <Dashboard /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
