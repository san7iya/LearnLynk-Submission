'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Check, 
  Clock, 
  FileText, 
  Calendar, 
  Loader2,
  Inbox
} from "lucide-react";

type Task = {
  id: string;
  application_id: string;
  type: string;
  status: string;
  due_at: string;
};

export default function TodayTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Format date only on client to avoid hydration mismatch
    setFormattedDate(
      new Date().toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      })
    );
  }, []);

  const fetchTasksDueToday = async () => {
    setLoading(true);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("tasks")
      .select("id, application_id, type, status, due_at")
      .neq("status", "completed")
      .gte("due_at", startOfDay.toISOString())
      .lte("due_at", endOfDay.toISOString())
      .order("due_at", { ascending: true });

    if (!error && data) {
      setTasks(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTasksDueToday();
  }, []);

  const markTaskComplete = async (taskId: string) => {
    setCompletingId(taskId); // Show loading spinner on specific button
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId);

    if (!error) {
      // Optimistic update: remove from list immediately for snappier UI
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
    setCompletingId(null);
  };

  // Helper to format time nice and clean (e.g. "2:30 PM")
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm font-medium">
            <Calendar size={16} />
            <span>{formattedDate}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Tasks Due Today
          </h1>
        </header>

        {/* Loading State - Skeleton Cards */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-3xl h-24 animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && tasks.length === 0 && (
          <div className="bg-white rounded-[40px] p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-400 mt-2">No pending tasks due for today.</p>
          </div>
        )}

        {/* Task List */}
        {!loading && tasks.length > 0 && (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className="group bg-white p-5 rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left Side: Icon & Info */}
                <div className="flex items-start gap-4">
                  {/* Type Icon Box */}
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 capitalize">
                        {task.type.replace('_', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold tracking-wide uppercase">
                        {task.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-400 font-mono">
                      ID: {task.application_id}
                    </p>
                  </div>
                </div>

                {/* Right Side: Time & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pl-[4.5rem] sm:pl-0">
                  
                  {/* Time Display */}
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl">
                    <Clock size={16} className="text-amber-400" />
                    {formatTime(task.due_at)}
                  </div>

                  {/* Complete Action Button */}
                  <button
                    onClick={() => markTaskComplete(task.id)}
                    disabled={completingId === task.id}
                    className="w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-black/20 disabled:opacity-70 disabled:cursor-not-allowed group-active:scale-95"
                    title="Mark as Complete"
                  >
                    {completingId === task.id ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Check size={20} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}