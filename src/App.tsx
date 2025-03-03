// src/App.tsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("Current path:", location.pathname);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <nav className="p-4 bg-gray-800 shadow-md">
        <ul className="flex space-x-6 justify-center">
          <li><Link to="/" className="text-blue-400 hover:text-blue-500 transition-colors">Home</Link></li>
          <li><Link to="/login" className="text-blue-400 hover:text-blue-500 transition-colors">Login</Link></li>
          <li><Link to="/register" className="text-blue-400 hover:text-blue-500 transition-colors">Register</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={<h1 className="text-4xl font-bold text-center mt-20 text-purple-400">Welcome to Infinity Gaming Lounge</h1>}
        />
      </Routes>
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
