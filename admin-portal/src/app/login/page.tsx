"use client";

import React, { useState } from "react";
import { MapPin, Loader2, Lock, Mail, ArrowRight, Eye, EyeOff, CheckSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome to Admin Portal");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#071120] overflow-x-hidden overflow-y-auto font-sans">
      {/* Full-Screen Background with Dark Overlay (Hidden on Mobile) */}
      <div className="absolute inset-0 z-0 hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1520626880097-40cce45e851e?q=80&w=2940&auto=format&fit=crop"
          alt="Ethiopia Landscape"
          className="w-full h-full object-cover object-center"
        />
        {/* Navy/Teal/Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071120]/95 via-[#071120]/80 to-[#071120]/40" />
      </div>

      {/* Responsive Split Layout */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-7xl mx-auto flex-1 py-12 lg:py-0">
        
        {/* Left Side - Branding & Text */}
        <div className="flex flex-col justify-center items-center text-center lg:items-start lg:text-left px-6 py-4 lg:flex-1 lg:p-20 text-white lg:pr-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl flex flex-col items-center lg:items-start w-full"
          >
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-10">
              <img 
                src="https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg" 
                alt="Kambata Travel Logo" 
                className="h-10 lg:h-20 w-auto object-contain brightness-0 invert" 
              />
              <span className="text-2xl lg:text-3xl font-bold tracking-tight text-white border-l border-white/20 pl-4 py-1">Admin</span>
            </div>

            <h1 className="text-4xl lg:text-7xl font-bold leading-tight tracking-tight mb-4 lg:mb-6">
              Manage the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-[#FF8C00]">
                Extraordinary.
              </span>
            </h1>
            <p className="text-[15px] lg:text-lg text-gray-300 font-medium leading-relaxed max-w-sm lg:max-w-md">
              Securely access operations, manage local guides, and oversee premium travel experiences across Ethiopia.
            </p>

            <div className="mt-10 lg:mt-16 flex items-center justify-center lg:justify-start gap-4 opacity-50 w-full">
              <p className="text-[10px] lg:text-xs font-bold tracking-[0.2em] uppercase shrink-0">Enterprise Portal</p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Glassmorphism Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 lg:p-12 w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-[440px] bg-[#0E1629] lg:bg-white/10 backdrop-blur-2xl border border-[#1E293B] lg:border-white/10 rounded-3xl p-6 lg:p-12 lg:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group"
          >
            {/* Subtle glow effect behind card */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-[#00B4D8]/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-[#FF8C00]/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-400 font-medium mb-10">Enter your credentials to access the workspace.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00B4D8] transition-colors" size={20} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[15px] font-bold text-white placeholder-gray-600 outline-none focus:bg-black/40 focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8] transition-all [&:-webkit-autofill]:bg-black/40 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s]"
                      placeholder="admin@kambatatravel.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00B4D8] transition-colors" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-[15px] font-bold text-white placeholder-gray-600 outline-none focus:bg-black/40 focus:border-[#00B4D8] focus:ring-1 focus:ring-[#00B4D8] transition-all [&:-webkit-autofill]:bg-black/40 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[9999s]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Options row */}
                <div className="flex items-center justify-between pt-2">
                  <button 
                    type="button" 
                    onClick={() => setRememberMe(!rememberMe)}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#00B4D8] border-[#00B4D8]' : 'border-gray-500 bg-transparent'}`}>
                      {rememberMe && <CheckSquare size={14} className="text-white" />}
                    </div>
                    <span className="font-medium">Remember me</span>
                  </button>
                  <a href="#" className="text-sm font-bold text-[#00B4D8] hover:text-white transition-colors">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#FF8C00] to-[#E65100] text-white py-4 rounded-2xl font-black text-sm hover:shadow-[0_8px_25px_-5px_rgba(255,140,0,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group mt-6"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>

      </div>
      
      {/* Mobile Footer */}
      <div className="relative z-10 lg:hidden w-full px-6 py-8 border-t border-[#1E293B] mt-auto">
        <div className="max-w-[440px] mx-auto flex flex-col gap-6 text-[13px]">
          <div className="flex items-start gap-4">
            <span className="text-[#FF8C00] font-black tracking-tight shrink-0 mt-0.5">KAMBATA</span>
            <p className="text-gray-400 font-medium leading-relaxed">
              &copy; 2024 Travel Management.<br/>Secure Enterprise Portal.
            </p>
          </div>
          <div className="flex items-center justify-between text-gray-400 font-medium w-full px-1">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
