"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import apiClient from "@/utils/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import { get, set } from "idb-keyval";
import { toast } from "react-hot-toast";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Calendar,
  Hash,
  ChevronLeft,
  RefreshCw,
  WifiOff,
  Edit3
} from "lucide-react";

type ScanState = "idle" | "scanning" | "success" | "duplicate" | "error";

interface ScanResult {
  travelerName: string;
  referenceNumber: string;
  tourName: string;
  partySize: number;
  checkedInAt: string;
}

// Tiny beep synthesiser — no external audio file needed
function playBeep(type: "success" | "error") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "success") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    }
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (_) { /* silently fail on unsupported browsers */ }
}

export default function QRScannerPage() {
  const scannerRef = useRef<any>(null);
  const scannerDivId = "guide-qr-reader";
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const isProcessing = useRef(false);

  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [manualRef, setManualRef] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const [gpsData, setGpsData] = useState<{lat: number, lng: number} | null>(null);
  const [pendingVerification, setPendingVerification] = useState<any>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinCode, setPinCode] = useState("");

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const loadOfflineData = async () => {
      try {
        const storedQueue = await get("kambata_offline_qr");
        if (storedQueue && Array.isArray(storedQueue)) {
          setOfflineQueue(storedQueue);
        }
        const storedSyncTime = await get("kambata_last_sync");
        if (storedSyncTime) {
          setLastSyncTime(storedSyncTime);
        }
      } catch (e) {
        console.error("Failed to load offline data from IndexedDB", e);
      }
    };
    
    loadOfflineData();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const [isSyncing, setIsSyncing] = useState(false);

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    
    try {
      const response = await apiClient.post("/qr/sync-offline", {
        scans: offlineQueue
      });
      
      const { data } = response.data;
      const failedScans: any[] = [];
      let successCount = 0;

      data.forEach((res: any, index: number) => {
        if (res.status === "Success") {
          successCount++;
        } else {
          // If it's a network error or transient error, keep it in queue
          // If it's a hard validation error, we should probably discard it or log it
          failedScans.push(offlineQueue[index]);
        }
      });

      setOfflineQueue(failedScans);
      await set("kambata_offline_qr", failedScans);
      
      if (successCount > 0) {
        const now = new Date().toISOString();
        setLastSyncTime(now);
        await set("kambata_last_sync", now);
        toast.success(`Successfully synced ${successCount} offline scans!`);
      }
    } catch (err: any) {
      if (err.message !== "Network Error") {
        toast.error("Failed to sync offline scans. Will retry later.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [isOffline, offlineQueue.length]);

  const verifyPass = async (payload: any) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      let lat = gpsData?.lat;
      let lng = gpsData?.lng;
      if (!lat || !lng) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setGpsData({ lat, lng });
        } catch (e) {
          // Proceed without GPS, backend might require override
        }
      }

      const endpoint = payload.isManual ? "/qr/manual-verify" : "/qr/verify";
      const requestData = { ...payload, latitude: lat, longitude: lng };

      const { data: res } = await apiClient.post(endpoint, requestData);
      
      setResult({
        travelerName: res.data.travelerName,
        referenceNumber: res.data.bookingRef,
        tourName: res.data.tourName,
        partySize: res.data.seats,
        checkedInAt: new Date().toISOString(),
      });
      setScanState("success");
      playBeep("success");
      setManualRef("");
      setPendingVerification(null);
      setShowOverrideModal(false);
      setShowPinModal(false);
      setPinCode("");
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.message || err?.message || "Unknown error";
      setErrorMsg(msg);
      
      if (data?.requiresOverride) {
        setPendingVerification(payload);
        setOverrideMessage(msg);
        setShowOverrideModal(true);
        playBeep("error");
      } else if (data?.requirePin) {
        setPendingVerification(payload);
        setShowPinModal(true);
        playBeep("error");
      } else if (msg.toLowerCase().includes("already checked in")) {
        setScanState("duplicate");
        playBeep("error");
      } else {
        setScanState("error");
        playBeep("error");
      }
    } finally {
      isProcessing.current = false;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRef.trim()) return;
    verifyPass({ isManual: true, referenceNumber: manualRef.trim().toUpperCase() });
  };

  const handleOverrideConfirm = () => {
    if (!pendingVerification) return;
    verifyPass({ ...pendingVerification, overrideGps: true });
  };

  const handlePinSubmit = () => {
    if (!pendingVerification || !pinCode.trim()) return;
    verifyPass({ ...pendingVerification, pinCode: pinCode.trim() });
  };

  const startScanner = () => {
    setScanState("scanning");
  };

  useEffect(() => {
    if (scanState !== "scanning") return;

    let isMounted = true;
    let html5QrcodeScanner: any;

    const initScanner = async () => {
      // Retry loop to ensure the div is mounted by framer-motion
      let el = document.getElementById(scannerDivId);
      let attempts = 0;
      while (!el && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        el = document.getElementById(scannerDivId);
        attempts++;
      }

      if (!isMounted) return;
      if (!el) {
        setErrorMsg("Failed to initialize scanner: container not found");
        setScanState("error");
        return;
      }

      const { Html5Qrcode } = await import("html5-qrcode");
      if (!isMounted) return;

      // Clean up any existing instance in the DOM just in case
      el.innerHTML = "";

      html5QrcodeScanner = new Html5Qrcode(scannerDivId);

      try {
        console.log("Scanner initializing...");
        
        // 1. Get cameras
        const devices = await Html5Qrcode.getCameras();
        console.log(`Cameras found: ${devices.length}`, devices);

        if (!devices || devices.length === 0) {
          throw new Error("No cameras found on this device.");
        }

        // 2. Select camera (prefer environment/back camera if possible, or fallback to first)
        const cameraId = devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;
        console.log("Selected camera:", cameraId);

        // 3. Start scanner
        await html5QrcodeScanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 280, height: 280 },
          },
          (decodedText: string) => {
            if (isProcessing.current) return;
            
            try {
              if (html5QrcodeScanner) html5QrcodeScanner.stop();
            } catch(e) {}

            try {
              const parsed = JSON.parse(decodedText);
              const token = parsed?.token;
              const bookingId = parsed?.bookingId;
              const bookingType = parsed?.bookingType || "tour";

              if (!token || !bookingId) throw new Error("Invalid QR format");

              if (!navigator.onLine) {
                const newQ = [...offlineQueue, { token, bookingId, bookingType, scannedAt: new Date().toISOString() }];
                setOfflineQueue(newQ);
                set("kambata_offline_qr", newQ).catch(e => console.error("idb save failed", e));
                setResult({
                  travelerName: "Offline Scan Logged",
                  referenceNumber: "Pending Sync",
                  tourName: "Will verify when online",
                  partySize: 0,
                  checkedInAt: new Date().toISOString(),
                });
                setScanState("success");
                playBeep("success");
                return;
              }

              verifyPass({ token, bookingId, bookingType });
            } catch (err: any) {
              setErrorMsg("Invalid QR Code format");
              setScanState("error");
              playBeep("error");
            }
          },
          (errorMessage: string) => {
            // Frame errors (normal when no QR is in view)
            if (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission denied")) {
               console.error("Permission status: Denied", errorMessage);
               if (isMounted) {
                 setErrorMsg("Camera access denied. Please grant permissions in your browser settings.");
                 setScanState("error");
                 playBeep("error");
               }
            }
          }
        );
        
        console.log("Scanner start success");

      } catch (err: any) {
        console.error("Scanner start failure:", err);
        if (isMounted) {
          setErrorMsg(err?.message || "Failed to start camera. Please check permissions.");
          setScanState("error");
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (html5QrcodeScanner) {
        try { html5QrcodeScanner.stop().catch(() => {}); } catch(e) {}
      }
    };
  }, [scanState]);

  const resetScanner = () => {
    isProcessing.current = false;
    setResult(null);
    setErrorMsg("");
    setScanState("idle");
    setPendingVerification(null);
    setShowOverrideModal(false);
    setShowPinModal(false);
    setPinCode("");
  };

  return (
    <div className="max-w-2xl mx-auto pb-16 relative">
      {/* Modals */}
      <AnimatePresence>
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#0A0F1C] rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-amber-200 dark:border-amber-500/30"
            >
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Location Warning</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{overrideMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverrideConfirm}
                  className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Override
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-[#0A0F1C] rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100 dark:border-white/10"
            >
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Security PIN Required</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ask the traveler for their 4-digit security PIN to confirm this pass.</p>
              <input
                type="text"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="____"
                className="w-full text-center text-3xl tracking-[1em] font-mono bg-gray-50 dark:bg-[#0F172A] border border-gray-200 dark:border-white/10 rounded-2xl py-4 mb-6 focus:ring-2 focus:ring-[#1A331B] dark:focus:ring-emerald-500 outline-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={pinCode.length < 4}
                  className="flex-1 bg-[#1A331B] dark:bg-emerald-500 text-white font-bold py-3 rounded-xl disabled:opacity-50 transition-colors"
                >
                  Verify PIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Badges */}
      {isOffline ? (
        <div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
          <div className="flex items-center gap-2">
            <WifiOff size={16} />
            <span className="font-bold">Offline Mode Active</span>
          </div>
          <div className="flex items-center gap-3">
            {lastSyncTime && <span className="text-xs opacity-70">Last Sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>}
            <span className="font-medium bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-md">
              {offlineQueue.length} Pending Sync
            </span>
          </div>
        </div>
      ) : offlineQueue.length > 0 ? (
        <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-2xl flex items-center justify-between text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
              <span className="font-bold">{offlineQueue.length} Scans Pending Sync</span>
            </div>
            {lastSyncTime && <span className="text-xs opacity-70">Last Sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>}
          </div>
          <button 
            onClick={syncOfflineQueue}
            disabled={isSyncing}
            className="font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      ) : lastSyncTime ? (
        <div className="mb-6 flex justify-end">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 size={12} /> Sync Complete (Last: {new Date(lastSyncTime).toLocaleTimeString()})
          </span>
        </div>
      ) : null}
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/guide-dashboard/attendance"
          className="w-11 h-11 rounded-2xl bg-white dark:bg-[#0A0F1C] border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-[#1A331B] dark:hover:text-emerald-400 shadow-sm transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            QR Check-In Scanner
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Scan a traveler's digital boarding pass to check them in.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {scanState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#0A0F1C] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl p-12 text-center"
          >
            <div className="w-28 h-28 bg-[#1A331B]/5 dark:bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-[#1A331B]/10 dark:border-emerald-500/20">
              <QrCode size={56} className="text-[#1A331B] dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-3">
              Ready to Scan
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-xs mx-auto">
              Ask the traveler to open their Digital Boarding Pass in the Kambata app, then tap the button below.
            </p>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-3 mb-10">
              {["Ask for Pass", "Point Camera", "Confirm"].map((step, i) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-black text-sm flex items-center justify-center">
                      {i + 1}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{step}</span>
                  </div>
                  {i < 2 && <div className="w-8 h-px bg-gray-200 dark:bg-white/10 mb-4" />}
                </React.Fragment>
              ))}
            </div>

            <button
              onClick={startScanner}
              className="bg-[#1A331B] text-white font-black px-10 py-4 rounded-2xl text-sm shadow-xl shadow-[#1A331B]/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#1A331B]/30 transition-all"
            >
              Open Camera Scanner
            </button>
          </motion.div>
        )}

        {/* SCANNING STATE */}
        {scanState === "scanning" && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-[#0A0F1C] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-sm font-black text-gray-900 dark:text-white">Camera Active — Hold Pass Steady</span>
              </div>
              <button
                onClick={resetScanner}
                className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                Cancel
              </button>
            </div>

            {/* html5-qrcode mounts here */}
            <div className="p-4">
              <div
                id={scannerDivId}
                className="[&_video]:rounded-[1.5rem] [&_img]:rounded-[1.5rem] [&_select]:bg-white [&_select]:dark:bg-[#0A0F1C] [&_select]:text-gray-900 [&_select]:dark:text-white [&_select]:rounded-xl [&_select]:border [&_select]:border-gray-200 [&_select]:dark:border-white/10 [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm"
              />
            </div>

            <div className="px-6 pb-6 text-center">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                Align the QR code within the square frame. The scan will happen automatically.
              </p>
            </div>
          </motion.div>
        )}

        {/* SUCCESS STATE */}
        {scanState === "success" && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white dark:bg-[#0A0F1C] rounded-[2.5rem] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden"
          >
            {/* Green success banner */}
            <div className="bg-emerald-500 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 relative"
              >
                <CheckCircle2 size={44} className="text-white" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-white"
              >
                Traveler Verified
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-emerald-100 text-sm font-medium mt-1"
              >
                Attendance marked as Present
              </motion.p>
            </div>

            {/* Traveler Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Users size={10} /> Traveler Name
                  </p>
                  <p className="font-black text-gray-900 dark:text-white text-lg leading-tight">
                    {result.travelerName || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Hash size={10} /> Booking Ref
                  </p>
                  <p className="font-black text-gray-900 dark:text-white text-lg leading-tight font-mono">
                    {result.referenceNumber}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#0F172A] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Users size={10} /> Party Size
                  </p>
                  <p className="font-black text-gray-900 dark:text-white text-lg">
                    {result.partySize} {result.partySize === 1 ? "Traveler" : "Travelers"}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <Calendar size={10} /> Checked In
                  </p>
                  <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {new Date(result.checkedInAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {result.tourName && (
                <div className="bg-[#1A331B]/5 dark:bg-emerald-500/5 rounded-2xl p-4 border border-[#1A331B]/10 dark:border-emerald-500/10">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tour</p>
                  <p className="font-bold text-[#1A331B] dark:text-emerald-400 text-sm">{result.tourName}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={resetScanner}
                  className="w-full flex items-center justify-center gap-2 bg-[#1A331B] text-white font-black py-4 rounded-2xl text-sm shadow-lg shadow-[#1A331B]/20 hover:-translate-y-0.5 transition-all"
                >
                  <RefreshCw size={16} />
                  Scan Next Traveler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* DUPLICATE STATE */}
        {scanState === "duplicate" && (
          <motion.div
            key="duplicate"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white dark:bg-[#0A0F1C] rounded-[2.5rem] border border-amber-200 dark:border-amber-500/30 shadow-2xl shadow-amber-500/10 overflow-hidden"
          >
            <div className="bg-amber-500 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={44} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Already Checked In</h2>
              <p className="text-amber-100 text-sm font-medium mt-1">
                This traveler has already been verified.
              </p>
            </div>
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {errorMsg || "This boarding pass has already been scanned for this tour. No changes were made."}
              </p>
              <button
                onClick={resetScanner}
                className="flex items-center justify-center gap-2 bg-amber-500 text-white font-black px-8 py-4 rounded-2xl text-sm mx-auto shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 transition-all"
              >
                <RefreshCw size={16} /> Scan Another
              </button>
            </div>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {scanState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white dark:bg-[#0A0F1C] rounded-[2.5rem] border border-red-200 dark:border-red-500/30 shadow-2xl shadow-red-500/10 overflow-hidden"
          >
            <div className="bg-red-500 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={44} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white">Invalid QR Code</h2>
              <p className="text-red-100 text-sm font-medium mt-1">
                This pass could not be verified.
              </p>
            </div>
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {errorMsg || "The QR code is invalid, expired, or not assigned to one of your scheduled tours."}
              </p>
              <button
                onClick={resetScanner}
                className="flex items-center justify-center gap-2 bg-red-500 text-white font-black px-8 py-4 rounded-2xl text-sm mx-auto shadow-lg shadow-red-500/20 hover:-translate-y-0.5 transition-all"
              >
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick stats footer — how many scanned so far this session */}
      {(scanState === "idle" || scanState === "scanning") && (
        <div className="mt-6 text-center space-y-4">
          <div className="max-w-md mx-auto">
            {showManual ? (
              <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="KT-XXXXX"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-[#1A331B] dark:focus:ring-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!manualRef.trim() || isProcessing.current}
                  className="bg-[#1A331B] dark:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-300 font-bold px-3 py-2.5 rounded-xl text-sm"
                >
                  <XCircle size={18} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowManual(true)}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1A331B] dark:text-emerald-400 hover:opacity-80 transition-opacity bg-white dark:bg-[#0A0F1C] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 shadow-sm"
              >
                <Edit3 size={16} /> Enter Reference Manually
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
            Need to mark attendance from list?{" "}
            <Link href="/guide-dashboard/attendance" className="text-[#1A331B] dark:text-emerald-400 font-bold hover:underline">
              Open Attendance List
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
