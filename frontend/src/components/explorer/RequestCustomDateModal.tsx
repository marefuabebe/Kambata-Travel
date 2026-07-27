import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, Clock, Users, FileText, Send, CheckCircle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";

interface RequestCustomDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemType: "tourId" | "packageId";
  title: string;
  requestType?: "custom_date" | "private_tour" | "waitlist";
}

export default function RequestCustomDateModal({
  isOpen,
  onClose,
  itemId,
  itemType,
  title,
  requestType = "custom_date",
}: RequestCustomDateModalProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    preferredDate: "",
    preferredEndDate: "",
    preferredTime: "Morning",
    travelers: 2,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalSteps = 4;

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await apiClient.post("/requests", {
        [itemType]: itemId,
        requestType,
        ...formData,
      });
      setSuccess(true);
      toast.success(t("modal.requestSuccess"));
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setCurrentStep(1);
        setFormData({ preferredDate: "", preferredEndDate: "", preferredTime: "Morning", travelers: 2, notes: "" });
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("modal.requestFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const headerTitles = {
    custom_date: t("modal.customDate"),
    private_tour: t("modal.privateTour"),
    waitlist: t("modal.joinWaitlist"),
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pb-4 pt-[100px] overflow-y-auto custom-scrollbar">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-10"
        >
          {success ? (
            <div className="p-12 text-center flex flex-col items-center">
              <CheckCircle size={64} className="text-emerald-500 mb-6" />
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t("modal.requestReceived")}</h2>
              <p className="text-gray-500 dark:text-gray-400">
                {t("modal.matchingGuide")}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">
                    {headerTitles[requestType]}
                  </h2>
                  <p className="text-xs font-bold text-[#FF8C00] mt-1">
                    {t("modal.step")} {currentStep} {t("modal.of")} {totalSteps}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-white/5 rounded-full shadow-sm transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-gray-100 dark:bg-white/5 shrink-0">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FF8C00] to-[#e67e00]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Body */}
              <div className="p-6 space-y-8 relative z-10">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("modal.whenTravel")}</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <CalendarIcon size={12} /> {t("modal.startDate")}
                          </label>
                          <input
                            type="date"
                            required
                            min={new Date().toISOString().split("T")[0]}
                            value={formData.preferredDate}
                            onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <CalendarIcon size={12} /> {t("modal.endDateOpt")}
                          </label>
                          <input
                            type="date"
                            min={formData.preferredDate || new Date().toISOString().split("T")[0]}
                            value={formData.preferredEndDate}
                            onChange={(e) => setFormData({ ...formData, preferredEndDate: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("modal.whoTravel")}</h3>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                          <Users size={12} /> {t("modal.numTravelers")}
                        </label>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, travelers: Math.max(1, formData.travelers - 1) })}
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl font-black text-gray-600 dark:text-gray-300"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black text-gray-900 dark:text-white w-12 text-center">
                            {formData.travelers}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, travelers: formData.travelers + 1 })}
                            className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xl font-black text-gray-600 dark:text-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("modal.specificReqs")}</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <Clock size={12} /> {t("modal.preferredTime")}
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {["Morning", "Afternoon", "Flexible"].map((time) => {
                              const displayTime = time === "Morning" ? t("modal.morning") : time === "Afternoon" ? t("modal.afternoon") : t("modal.flexible");
                              return (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, preferredTime: time })}
                                  className={`py-3 px-2 rounded-xl text-xs font-bold border transition-colors ${
                                    formData.preferredTime === time
                                      ? "bg-[#FF8C00]/10 border-[#FF8C00] text-[#FF8C00]"
                                      : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  {displayTime}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                            <FileText size={12} /> {t("modal.specialNotes")}
                          </label>
                          <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t("modal.notesPlaceholder")}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50 resize-none"
                          ></textarea>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("modal.reviewReq")}</h3>
                      <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10 space-y-3">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/10">
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t("modal.dates")}</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">
                            {formData.preferredDate ? new Date(formData.preferredDate).toLocaleDateString() : t("modal.notSet")}
                            {formData.preferredEndDate && ` - ${new Date(formData.preferredEndDate).toLocaleDateString()}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/10">
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t("modal.whoTravel")}</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">{formData.travelers} {t("modal.pax")}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/10">
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">{t("modal.preferredTime")}</span>
                          <span className="text-sm font-black text-gray-900 dark:text-white">{formData.preferredTime === "Morning" ? t("modal.morning") : formData.preferredTime === "Afternoon" ? t("modal.afternoon") : t("modal.flexible")}</span>
                        </div>
                        {formData.notes && (
                          <div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-widest block mb-1">{t("modal.notes")}</span>
                            <p className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-black/20 p-2 rounded-lg">{formData.notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex gap-3 shrink-0">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-4 rounded-xl font-black text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-colors"
                  >
                    {t("modal.back")}
                  </button>
                )}
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={currentStep === 1 && !formData.preferredDate}
                    className="flex-1 py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white rounded-xl font-black text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("modal.continue")}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-4 bg-gradient-to-r from-[#FF8C00] to-[#e67e00] text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg shadow-[#FF8C00]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? t("modal.submitting") : <>{t("modal.submitRequest")} <Send size={16} /></>}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
