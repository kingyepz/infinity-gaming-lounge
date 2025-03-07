import React, { useState } from "react";
import { auth } from "../../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("Login successful! User:", userCredential.user);
      navigate("/");
    } catch (err: any) {
      console.error("Login failed:", err.code, err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
            Login
          </h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 p-2 w-full bg-gray-100 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 p-2 w-full bg-gray-100 border border-gray-300 rounded-md text-gray-700 focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side - Purple Background with Text and Animations */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-purple-600 p-8">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4 animate-bounce">
            Welcome Back!
          </h1>
          <p className="text-xl mb-8 animate-pulse">Please login to continue</p>
          <div className="flex justify-center space-x-4">
            <div className="w-12 h-12 bg-purple-400 rounded-full animate-spin"></div>
            <div className="w-12 h-12 bg-purple-400 rounded-full animate-ping"></div>
            <div className="w-12 h-12 bg-purple-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
