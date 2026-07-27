"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import apiClient from "@/utils/apiClient";
import toast from "react-hot-toast";
import { PageHeader, LoadingCenter } from "@/components/admin/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const localizer = momentLocalizer(moment);

export default function AdminGuideCalendarPage() {
  const params = useParams();
  const id = params?.id as string;
  const [guide, setGuide] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [guideRes, calendarRes] = await Promise.all([
          apiClient.get(`/admin/guides/${id}`),
          apiClient.get(`/admin/guides/${id}/calendar`)
        ]);
        setGuide(guideRes.data);
        
        // Format dates for big-calendar
        const formatted = calendarRes.data.data.map((ev: any) => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
        }));
        setEvents(formatted);
      } catch (error) {
        toast.error("Failed to load guide calendar");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id]);

  const eventStyleGetter = (event: any) => {
    let backgroundColor = "#10B981"; // Emerald for assignments
    
    if (event.type === "timeOff") {
      backgroundColor = "#EF4444"; // Red for unavailable
    } else if (event.assignmentStatus === "pending") {
      backgroundColor = "#F59E0B"; // Amber for pending assignments
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontWeight: "bold",
        fontSize: "12px",
        padding: "4px 8px"
      }
    };
  };

  if (loading) return <LoadingCenter />;
  if (!guide) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link
          href="/guides"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#1A331B] transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Guides
        </Link>
        <PageHeader
          title={`${guide.name.split(" ")[0]}'s Calendar`}
          subtitle={`Manage scheduling availability for ${guide.name}`}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-[2.5rem] border border-gray-100 p-6 md:p-8 shadow-sm"
      >
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-bold text-gray-600">Assigned Tours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            <span className="text-sm font-bold text-gray-600">Pending Assignment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm font-bold text-gray-600">Time Off / Unavailable</span>
          </div>
        </div>
        
        <div className="h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%', fontFamily: 'inherit' }}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            tooltipAccessor={(event: any) => `${event.title} - ${event.status}`}
          />
        </div>
      </motion.div>
    </div>
  );
}
