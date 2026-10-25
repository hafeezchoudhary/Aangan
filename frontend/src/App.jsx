
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Children from "./pages/Children";
import Donation from "./pages/Donation";
import Expenses from "./pages/Expenses";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/children" element={<Children />} />
          <Route path="/donations" element={<Donation />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
