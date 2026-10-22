// Login.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Navigate } from "react-router-dom";
import { loginUser, clearError } from "../../features/authSlice";
import { homeFor } from "../../utils/roles";

export default function Login() {
  const dispatch = useDispatch();
const navigate = useNavigate();
const { user, loading, error } = useSelector((s) => s.auth);
const [form, setForm] = useState({ email: "", password: "" });
const [localError, setLocalError] = useState("");

if (user) return <Navigate to={homeFor(user.role)} replace />;

const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
  setLocalError("");
  if (error) dispatch(clearError());
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.email || !form.password) return setLocalError("All fields are required");

  const res = await dispatch(loginUser(form)); 
  if (loginUser.fulfilled.match(res)) {
    navigate(homeFor(res.payload.role), { replace: true });
  } else {
    console.log("Login failed:", res.payload);
  }
};

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1c1a6b]">
      {/* stars */}
      {[...Array(24)].map((_, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-white"
          style={{ top: `${(i * 37) % 60}%`, left: `${(i * 53) % 100}%`, opacity: 0.8 }}
        />
      ))}

      {/* planet + moon */}
      <div className="absolute left-[6%] top-[12%] h-14 w-14 rounded-full bg-indigo-500">
        <div className="absolute -left-4 top-5 h-3 w-24 -rotate-12 rounded-full border-2 border-white" />
      </div>
      <div className="absolute right-[18%] top-[14%] h-24 w-24 rounded-full bg-slate-100" />

      {/* landscape */}
      <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[#2a2790]" />
      <div className="absolute bottom-[30%] left-0 right-0 h-3 bg-emerald-300" />
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-[#1f1d7a]" />
      <div className="absolute bottom-[28%] left-[4%] h-24 w-56 rounded-t-full bg-indigo-600" />
      <div className="absolute bottom-[28%] right-[4%] h-24 w-56 rounded-t-full bg-indigo-600" />

      {/* card */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-md bg-white px-8 py-10 shadow-2xl"
      >
        <h2 className="text-center text-xl font-semibold text-gray-800">
          Welcome
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Enter your Credentials
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded bg-gray-100 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded bg-gray-100 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-indigo-400"
            />
            <a href="#" className="mt-1 inline-block text-[10px] text-indigo-500 hover:underline">
              Forgot password?
            </a>
          </div>
        </div>

        {(localError || error) && <p className="mt-3 text-sm text-red-600">{localError || error}</p>}

      

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Let's go!"}
        </button>

        <p className="mt-3 text-[10px] text-gray-600">
          No account?{" "}
          <a href="#" className="text-indigo-500 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}