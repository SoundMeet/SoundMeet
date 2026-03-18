import React from "react";
import reactLogo from "../assets/react.svg";

const Login = () => {
  return (
    <div
      style={{ backgroundImage: `url(${reactLogo})` }}
      className="min-h-screen w-full p-12 flex justify-center items-center bg-gray-900 bg-center bg-repeat-space bg-size-[150px_75px] text-gray-300"
    >
      <form action="">
        <div className="rounded-3xl p-px max-w-sm bg-gradient from-gray-800 dark-to-transparent">
          <div className="rounded-lg p-12 bg-gray-900">
            <div>
                <div className="flex gap-2">

                <img src={reactLogo} alt="logo" />
              <h1 className="text-2xl font-semibold text-white">
                SoundMeet
              </h1>
                </div>
              {/* <p className="text-sm tracking-wide text-gray-300">Login as a user</p> */}
            </div>
            <div className="mt-8 space-y-8">
              <div className="space-y-6">
                <input
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md placeholder-gray-300 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 invalid:border-red-500 invalid:text-red-500"
                  placeholder="Username/email"
                  type="text"
                  name=""
                />
                <input
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md placeholder-gray-300 focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400 invalid:border-red-500 invalid:text-red-500"
                  placeholder="password"
                  type="password"
                  name=""
                />
                <p className="text-sm tracking-wide text-gray-300">
                  <a
                    href=""
                    className="text-yellow-400 hover:underline transition duration-200"
                  >
                    {" "}
                    Forgot Password
                  </a>
                </p>

                <button className="h-9 px-3 w-full bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-800 focus:bg-blue-700 transition duration-500 rounded-md">
                  Login
                </button>
                <p className="text-center text-sm tracking-wide text-gray-300">
                  Create an account
                  <a
                    href=""
                    className="text-yellow-400 hover:underline transition duration-200"
                  >
                    {" "}
                    Sign Up
                  </a>
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
