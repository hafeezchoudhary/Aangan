
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Protected admin pages */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen bg-page p-8 text-heading">
              <h1 className="text-3xl font-semibold">
                Welcome to Aaangan Dashboard
              </h1>
              <p className="mt-3 text-body">
                Your admin dashboard will be built here next.
              </p>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
