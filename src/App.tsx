import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import "./App.css";

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.log("Current path:", location.pathname);
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-text">
      <nav className="p-4 bg-gray-800 shadow-md">
        <ul className="flex space-x-6 justify-center">
          <li><Link to="/" className="text-primary hover:text-secondary transition-colors">Home</Link></li>
          <li><Link to="/login" className="text-primary hover:text-secondary transition-colors">Login</Link></li>
          <li><Link to="/register" className="text-primary hover:text-secondary transition-colors">Register</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
