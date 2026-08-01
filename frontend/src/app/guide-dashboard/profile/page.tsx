"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, MapPin, CheckCircle, Camera, Sparkles, ShieldCheck, UploadCloud, FileText, Clock, Loader2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "@/utils/apiClient";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import BioEditor from "@/components/guide/BioEditor";

export default function SaaSProfilePage() {
  const { user: authUser, refreshUser, setUser } = useAuth();
  const [guideStatus, setGuideStatus] = useState<string>("none");
  const [profileReady, setProfileReady] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    profilePicture: "",
    bio: "",
    experienceYears: 0,
    specialties: [] as string[],
    languages: ["English", "Amharic"] as string[],
    guideType: "Certified Expert",
    nationalId: { url: "", status: "pending" },
    license: { url: "", status: "pending" },
    age: ""
  });

  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);
  const licenseFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get("/guides/profile");
        const { name, email, phone, location, profilePicture, guideProfile, guideStatus: gs, profileReadyForReview } = res.data.data;
        setGuideStatus(gs || "none");
        setProfileReady(!!profileReadyForReview);
        
        const nameParts = name.split(" ");
        setIsVerified(guideProfile?.isVerified || false);
        setFormData({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: email || "",
          phone: phone || "",
          location: location || "",
          profilePicture: profilePicture || "",
          bio: guideProfile?.bio?.en || "",
          experienceYears: guideProfile?.experienceYears || 0,
          specialties: guideProfile?.specialties || [],
          languages: guideProfile?.languages || ["English", "Amharic"],
          guideType: guideProfile?.guideType || "Certified Expert",
          nationalId: guideProfile?.nationalId || { url: "", status: "pending" },
          license: guideProfile?.license || { url: "", status: "pending" },
          age: guideProfile?.age || ""
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const calculateCompleteness = () => {
    let score = 0;
    // Exactly matches backend admin requirements (guideController.js)
    if (formData.bio && formData.bio.trim().length >= 50) score += 20;
    if (formData.phone && formData.location) score += 15;
    if (formData.specialties && formData.specialties.length >= 1) score += 15;
    if (formData.languages && formData.languages.length >= 1) score += 10;
    if (formData.nationalId.url) score += 20;
    if (formData.license.url) score += 20;
    return score;
  };

  const handleGlobalUpload = async (file: File, type: 'avatar' | 'nationalId' | 'license') => {
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be smaller than 10MB");
      return;
    }

    const uploadData = new FormData();
    
    try {
      setIsUploading(type);
      setUploadProgress(prev => ({ ...prev, [type]: 0 }));
      
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(prev => ({ ...prev, [type]: percentCompleted }));
        }
      };
      
      if (type === 'avatar') {
        uploadData.append("image", file);
        const res = await apiClient.post("/users/profile-image", uploadData, config);
        if (res.data.success) {
          const url = res.data.data.profilePicture;
          setFormData(prev => ({ ...prev, profilePicture: url }));
          await refreshUser(); // Global Sync
        }
      } else {
        uploadData.append("document", file);
        uploadData.append("documentType", type);
        const res = await apiClient.post("/guides/upload-document", uploadData, config);
        if (res.data.success) {
          const docData = res.data.data[type];
          setFormData(prev => ({ ...prev, [type]: docData }));
          // Automatically re-check profile readiness now that a document has been added
          const check = await apiClient.get("/guides/profile");
          setProfileReady(!!check.data.data.profileReadyForReview);
        }
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(null);
    }
  };

  const handleSecureDownload = async (url: string, fileName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const downloadUrl = `${apiUrl}/guides/documents?url=${encodeURIComponent(url)}`;
  
      const response = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
  
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "document.pdf";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Secure download failed:", error);
      toast.error("Failed to download secure document");
    }
  };

  const handleSubmitForReview = async () => {
    setSubmittingReview(true);
    try {
      const { data } = await apiClient.post("/guides/submit-for-review");
      setGuideStatus(data.data.guideStatus);
      if (authUser) {
        const updated = { ...authUser, guideStatus: data.data.guideStatus };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not submit for review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.put("/guides/profile", {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        experienceYears: formData.experienceYears,
        specialties: formData.specialties,
        languages: formData.languages,
        guideType: formData.guideType,
        age: formData.age
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      await refreshUser();
      const check = await apiClient.get("/guides/profile");
      setProfileReady(!!check.data.data.profileReadyForReview);
    } catch (error) {
       console.error("Error saving profile:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin h-12 w-12 text-[#1A331B]" />
      </div>
    );
  }

  const completeness = calculateCompleteness();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto pb-24"
    >
      <div className="mb-10">
        <h1 className="font-black text-4xl text-gray-900 dark:text-white tracking-tight mb-2">Expert Identity</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Maintain your professional guide persona and essential credentials.</p>
      </div>

      <form onSubmit={handleSave}>
      {/* WIDGETS ROW (MOVED TO TOP TO ELIMINATE UNEQUAL SIDEBAR HEIGHTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
         {/* Completeness Widget */}
         <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-6 sm:p-8 shadow-sm flex flex-row items-center gap-4 sm:gap-8">
            <div className="relative w-20 h-20 sm:w-32 sm:h-32 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-white/10" />
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * completeness) / 100} className="text-emerald-500 transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white">{completeness}%</span>
              </div>
            </div>
            
            <div className="text-left">
               <h3 className="font-black text-base sm:text-lg text-gray-900 dark:text-white mb-1 sm:mb-2">Profile Strength</h3>
               <p className="text-xs sm:text-base font-bold text-emerald-600 mb-0 sm:mb-2">{completeness < 100 ? 'Action Required' : 'Expert Status'}</p>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed hidden sm:block">Complete your identity to gain priority placement in search results and admin approval.</p>
            </div>
         </div>

         {/* AI Widget */}
         <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-[#1E293B] border border-emerald-100 dark:border-emerald-500/20 rounded-[2.5rem] p-6 sm:p-8 text-gray-900 dark:text-white relative overflow-hidden shadow-sm flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/40 blur-3xl rounded-full" />
            <div className="relative z-10 flex items-center sm:items-start gap-4 sm:gap-6">
              <div className="bg-white dark:bg-[#0F172A] w-12 h-12 sm:w-14 sm:h-14 rounded-[1.25rem] shrink-0 flex items-center justify-center shadow-sm border border-emerald-100 dark:border-emerald-500/20">
                <Sparkles size={20} className="text-amber-500 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-lg sm:text-xl mb-1 sm:mb-2 tracking-tight text-gray-900 dark:text-white">Heritage AI Copilot</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-4 hidden sm:block">Our semantic engine can analyze your feedback and restructure your portfolio for maximum impact.</p>
                <button type="button" className="w-full sm:w-fit bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all">
                  <Sparkles size={16} /> <span className="hidden sm:inline">Refine Portfolio</span><span className="sm:hidden">Refine</span>
                </button>
              </div>
            </div>
         </div>
      </div>

      {/* TOP SECTION: Personal Info & Biography Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* LEFT COLUMN: Personal Information */}
        <div className="flex flex-col h-full">
          <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-100 dark:border-white/5 p-4 sm:p-5 shadow-sm h-full flex flex-col">
            {/* --- PERSONAL INFORMATION SECTION --- */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 mb-4 shrink-0">
              <h2 className="font-black text-xl text-gray-900 dark:text-white">Personal Information</h2>
              <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border ${isVerified ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                 {isVerified ? "Verified Expert" : "Verification Pending"}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-start">
              <div className="flex flex-row items-center gap-3 sm:gap-4 mb-3 p-2 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shrink-0">
                <div className="relative shrink-0">
                  <img loading="lazy" 
                    src={formData.profilePicture || `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=1A331B&color=fff`} 
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-md" 
                  />
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                      {isUploading === 'avatar' ? <Loader2 className="animate-spin text-white" /> : <Camera size={24} className="text-white" />}
                  </div>
                </div>
                <div className="text-left flex-1">
                   <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleGlobalUpload(e.target.files[0], 'avatar')} />
                   <button type="button" className="bg-white w-full sm:w-auto dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={!!isUploading}>
                      {isUploading === 'avatar' ? (
                        <div className="flex items-center justify-center gap-2">
                           <Loader2 className="animate-spin text-[#1A331B]" size={14} /> 
                           <span>{uploadProgress['avatar'] || 0}%</span>
                        </div>
                      ) : (
                        <><span className="hidden sm:inline">Change Photograph</span><span className="sm:hidden">Change Photo</span></>
                      )}
                   </button>
                   <p className="text-[9px] sm:text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest flex items-center justify-start gap-1">
                     <ShieldCheck size={12} className="text-emerald-500 shrink-0" /> <span className="hidden sm:inline">Cloudinary Verified Storage</span><span className="sm:hidden">Verified</span>
                   </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">First Name</label>
                  <input type="text" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Last Name</label>
                  <input type="text" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2 mb-2 sm:mb-3">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Professional Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl pl-10 pr-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="tel" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl pl-10 pr-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Base Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl pl-10 pr-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Professional Category</label>
                  <select className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer" value={formData.guideType} onChange={e => setFormData({...formData, guideType: e.target.value})}>
                    <option value="Standard Guide">Standard Guide</option>
                    <option value="Certified Expert">Certified Expert</option>
                    <option value="Master Storyteller">Master Storyteller</option>
                    <option value="Heritage Guardian">Heritage Guardian</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Age</label>
                  <input type="number" min="18" max="100" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 shadow-sm rounded-xl px-3 py-2.5 text-[14px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} placeholder="e.g. 35" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Core Specializations</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                   {["Highland Trekking", "Coffee Ceremonies", "Cultural Anthropology", "Wildlife Photography"].map(spec => (
                     <label key={spec} className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <input type="checkbox" id={`spec-${spec}`} checked={formData.specialties?.includes(spec)} 
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                          onChange={(e) => {
                            const specs = e.target.checked ? [...formData.specialties, spec] : formData.specialties.filter(s => s !== spec);
                            setFormData({...formData, specialties: specs});
                          }}
                        />
                        <span className="text-[13px] sm:text-[14px] font-bold text-gray-700 dark:text-gray-300 leading-tight truncate">{spec}</span>
                     </label>
                   ))}
                </div>
             </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Guide Biography */}
        <div className="flex flex-col h-full">
          <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-100 dark:border-white/5 p-4 sm:p-5 shadow-sm h-full flex flex-col">
            {/* --- GUIDE BIOGRAPHY SECTION --- */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 mb-4 shrink-0">
               <h2 className="font-black text-xl text-gray-900 dark:text-white">Guide Biography</h2>
               <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg">Public Profile</span>
            </div>
            
            <div className="flex-1 flex flex-col">
               <div className="space-y-2 mb-4 flex-1 flex flex-col min-h-[160px]">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Public Bio (Tellers of Kambata Stories)</label>
                  <BioEditor value={formData.bio} onChange={val => setFormData({...formData, bio: val})} />
               </div>

               <div className="grid grid-cols-1 gap-4 sm:gap-5 shrink-0">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-wide">Languages Spoken</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                       {["English", "Amharic", "Kambaata", "Oromo", "French"].map((lang) => (
                         <label key={lang} className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <input type="checkbox" id={`lang-${lang}`} checked={formData.languages?.includes(lang)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                              onChange={(e) => {
                                const langs = e.target.checked
                                  ? [...formData.languages, lang]
                                  : formData.languages.filter((l) => l !== lang);
                                setFormData({ ...formData, languages: langs });
                              }}
                            />
                            <span className="text-[13px] sm:text-[14px] font-bold text-gray-700 dark:text-gray-300 leading-tight truncate">{lang}</span>
                         </label>
                       ))}
                    </div>
                 </div>


               </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Credential Vault */}
      <div className="mb-8">
        <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm">
           <div className="flex flex-col items-center text-center justify-center border-b border-gray-100 dark:border-white/5 pb-6 mb-8 gap-4">
              <div className="flex flex-col items-center gap-1">
                 <h2 className="font-black text-xl text-gray-900 dark:text-white">Credential Vault</h2>
                 <p className="text-xs font-medium text-gray-500">Upload and manage your professional identity documents.</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-center gap-2 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl shrink-0"><Clock size={14}/> Security Verification Required</span>
           </div>
           
           {/* Side-by-side grid since we have full width */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] p-8 text-center transition-all hover:border-emerald-500 dark:hover:border-emerald-500 bg-gray-50/50 dark:bg-white/5 group flex flex-col justify-center">
                 <div className="w-14 h-14 rounded-[1.25rem] bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform border border-gray-100 dark:border-white/10">
                    <ShieldCheck size={28} />
                 </div>
                 <h4 className="font-black text-gray-900 dark:text-white text-lg mb-1">National ID Document</h4>
                 <p className="text-[10px] text-gray-500 mb-8 uppercase font-black tracking-widest">Required for Payouts</p>
                 
                 {formData.nationalId.url ? (
                    <div className={`flex items-center justify-center gap-2 text-xs font-bold p-4 rounded-2xl border mb-8
                       ${formData.nationalId.status === 'verified' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 
                         formData.nationalId.status === 'rejected' ? 'text-red-600 bg-red-50 border-red-200' : 
                         'text-amber-600 bg-amber-50 border-amber-200'}`}>
                       {formData.nationalId.status === 'verified' && <CheckCircle size={18} />}
                       {formData.nationalId.status === 'rejected' && <Clock size={18} />}
                       {formData.nationalId.status === 'pending' && <Clock size={18} />}
                       {formData.nationalId.status === 'verified' ? 'ID Verified Successfully' : formData.nationalId.status === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
                    </div>
                 ) : null}

                 <input type="file" ref={idFileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => e.target.files && handleGlobalUpload(e.target.files[0], 'nationalId')} />
                 <button type="button" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 px-6 py-4 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm max-w-sm mx-auto" onClick={() => idFileInputRef.current?.click()} disabled={!!isUploading}>
                    {isUploading === 'nationalId' ? (
                      <div className="w-full flex flex-col gap-2 items-center">
                         <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${uploadProgress['nationalId'] || 0}%` }}></div>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{uploadProgress['nationalId'] || 0}% Uploading</span>
                      </div>
                    ) : formData.nationalId.status === 'rejected' ? "Retry Upload" : "Upload National ID"}
                 </button>
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] p-8 text-center transition-all hover:border-emerald-500 dark:hover:border-emerald-500 bg-gray-50/50 dark:bg-white/5 group flex flex-col justify-center">
                 <div className="w-14 h-14 rounded-[1.25rem] bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform border border-gray-100 dark:border-white/10">
                    <FileText size={28} />
                 </div>
                 <h4 className="font-black text-gray-900 dark:text-white text-lg mb-1">Professional License</h4>
                 <p className="text-[10px] text-gray-500 mb-8 uppercase font-black tracking-widest">Expert Status Marker</p>

                 {formData.license.url ? (
                    <div className={`flex items-center justify-center gap-2 text-xs font-bold p-4 rounded-2xl border mb-8
                       ${formData.license.status === 'verified' ? 'text-blue-600 bg-blue-50 border-blue-200' : 
                         formData.license.status === 'rejected' ? 'text-red-600 bg-red-50 border-red-200' : 
                         'text-amber-600 bg-amber-50 border-amber-200'}`}>
                       {formData.license.status === 'verified' && <CheckCircle size={18} />}
                       {formData.license.status === 'rejected' && <Clock size={18} />}
                       {formData.license.status === 'pending' && <Clock size={18} />}
                       {formData.license.status === 'verified' ? 'License Verified Successfully' : formData.license.status === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
                    </div>
                 ) : null}

                 <input type="file" ref={licenseFileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => e.target.files && handleGlobalUpload(e.target.files[0], 'license')} />
                 <button type="button" className="w-full bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 px-6 py-4 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm max-w-sm mx-auto" onClick={() => licenseFileInputRef.current?.click()} disabled={!!isUploading}>
                    {isUploading === 'license' ? (
                      <div className="w-full flex flex-col gap-2 items-center">
                         <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${uploadProgress['license'] || 0}%` }}></div>
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{uploadProgress['license'] || 0}% Uploading</span>
                      </div>
                    ) : formData.license.status === 'rejected' ? "Retry Upload" : "Upload License"}
                 </button>
              </div>
           </div>
           
           {/* Verification Feed */}
           {(formData.nationalId.url || formData.license.url) && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {formData.nationalId.url && (
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                       <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-gray-100 dark:border-white/10 shrink-0"><ShieldCheck size={20} /></div>
                       <div className="flex-1 overflow-hidden">
                          <a href="#" onClick={(e) => handleSecureDownload(formData.nationalId.url, "National_ID.pdf", e)} className="text-xs font-bold text-gray-900 dark:text-white truncate hover:underline hover:text-emerald-600">
                             ID_Document_Uploaded.cdn
                          </a>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">Cloudinary Secured</p>
                       </div>
                       <span className="text-[8px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-50 px-2.5 py-1.5 rounded-lg shrink-0">Secured</span>
                    </div>
                 )}
                 {formData.license.url && (
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                       <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0F172A] shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-gray-100 dark:border-white/10 shrink-0"><FileText size={20} /></div>
                       <div className="flex-1 overflow-hidden">
                          <a href="#" onClick={(e) => handleSecureDownload(formData.license.url, "License.pdf", e)} className="text-xs font-bold text-gray-900 dark:text-white truncate hover:underline hover:text-emerald-600">
                             License_Document_Uploaded.cdn
                          </a>
                          <p className="text-[10px] font-medium text-gray-500 mt-0.5">Cloudinary Secured</p>
                       </div>
                       <span className="text-[8px] uppercase font-black tracking-widest text-emerald-500 bg-emerald-50 px-2.5 py-1.5 rounded-lg shrink-0">Secured</span>
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>

      {/* ACTION BAR (MOVED TO BOTTOM) */}
      <div className="bg-white dark:bg-[#1E293B] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start">
            {guideStatus === "pending" && (
              <span className="text-sm font-black text-amber-600 flex items-center gap-2"><Clock size={16} /> Awaiting admin security review</span>
            )}
            {guideStatus === "approved" && (
              <span className="text-sm font-black text-emerald-600 flex items-center gap-2"><CheckCircle size={16} /> Verified Expert Profile</span>
            )}
            {guideStatus === "rejected" && (
              <span className="text-sm font-black text-red-600 flex items-center gap-2"><ShieldCheck size={16} /> Verification Rejected</span>
            )}
            {(guideStatus === "none") && (
              <span className="text-sm font-black text-gray-500 flex items-center gap-2">Unverified Profile</span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
               {(!profileReady && (guideStatus === "none" || guideStatus === "rejected")) 
                  ? "Incomplete: Needs Bio (50+ chars), Contact Info, and 2 Documents." 
                  : "Secure Form System"}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="submit" className="flex-1 sm:flex-none bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2">
              {isSaved ? <><CheckCircle size={18} className={isSaved ? "text-emerald-500" : ""} /> Saved</> : "Save Changes"}
            </button>

            {(guideStatus === "none" || guideStatus === "rejected") && (
              <button
                type="button"
                disabled={submittingReview || !profileReady}
                onClick={handleSubmitForReview}
                className="flex-1 sm:flex-none bg-gradient-to-r from-[#FF8C00] to-[#E65100] hover:from-[#E65100] hover:to-[#FF8C00] text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#FF8C00]/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!profileReady ? "You must complete your profile and upload both documents before submitting." : "Submit your profile to admins for approval"}
              >
                {submittingReview ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                {submittingReview ? "Submitting…" : guideStatus === "rejected" ? "Resubmit" : "Submit for Review"}
              </button>
            )}
          </div>
        </div>
      </form>
    </motion.div>
  );
}

