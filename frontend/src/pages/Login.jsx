import React, { useState } from "react";
import reactLogo from "../assets/react.svg";
import { useAuth } from "../injectables/Auth.jsx";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(formData);
      navigate("/");
    } catch (err) {
      setError("Invalid username or password.");
      console.error(err);
    }
  };

  return (
    <div
      style={{ backgroundImage: `url(${reactLogo})` }}
      className="min-h-screen w-full p-12 flex justify-center items-center bg-gray-900 bg-center bg-repeat-space bg-size-[150px_75px] text-gray-300"
    >
      <form onSubmit={handleSubmit}>
        <div className="rounded-3xl p-px max-w-sm bg-gradient from-gray-800 dark-to-transparent">
          <div className="rounded-lg p-12 bg-gray-900">
            <div>
              <div className="flex gap-2">
                <img src={reactLogo} alt="logo" />
                <h1 className="text-2xl font-semibold text-white">
                  SoundMeet
                </h1>
              </div>
            </div>
            <div className="mt-8 space-y-8">
              <div className="space-y-6">
                
                {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

                <input
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md placeholder-gray-300 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 invalid:border-red-500 invalid:text-red-500 text-white"
                  placeholder="Username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                <input
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md placeholder-gray-300 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 invalid:border-red-500 invalid:text-red-500 text-white"
                  placeholder="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm tracking-wide text-gray-300">
                  <Link
                    to="/forgot-password"
                    className="text-yellow-400 hover:underline transition duration-200"
                  >
                    Forgot Password
                  </Link>
                </p>

                <button 
                  type="submit" 
                  className="h-9 px-3 w-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800 focus:bg-blue-700 transition duration-500 rounded-md"
                >
                  Login
                </button>
                <p className="text-center text-sm tracking-wide text-gray-300">
                  Create an account{" "}
                  <Link
                    to="/register"
                    className="text-yellow-400 hover:underline transition duration-200"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
