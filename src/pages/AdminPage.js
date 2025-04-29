import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/AdminPage.css";
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { fetchBlockedSlots } from "../utils/blockedSlotsService";

const AdminPage = () => {
  const navigate = useNavigate();

  // State variables for managing bookings, blocks, and UI state
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointmentsByDate, setAppointmentsByDate] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [unconfirmedBookings, setUnconfirmedBookings] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editedDate, setEditedDate] = useState('');
  const [editedTime, setEditedTime] = useState('');
  const [editedMessage, setEditedMessage] = useState('');
  const [blockTime, setBlockTime] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDays, setBlockDays] = useState([]); // e.g. ['M', 'T']
  const [blockEndDate, setBlockEndDate] = useState('');

  // Redirect user to login if not authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login');
    }
    checkAuth();
  }, [navigate]);

  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchBookings(),
      fetchAppointmentsForSelectedDate(),
      fetchBookedDates(),
      fetchUnconfirmedBookings()
    ]);
  };

  // Submit a new block (once or recurring)
  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    const startDate = formatDate(selectedDate);

    if (blockDays.length > 0 && blockEndDate) {
      for (const day of blockDays) {
        const { error } = await supabase.from('blocked_slots').insert({
          date: startDate,
          time: blockTime,
          reason: blockReason,
          day_of_week: day,
          end_date: blockEndDate,
          type: 'recurring'
        });
        if (error) console.error("Insert error:", error.message);
      }
    } else {
      const { error } = await supabase.from('blocked_slots').insert({
        date: startDate,
        time: blockTime,
        reason: blockReason,
        type: 'once'
      });
      if (error) console.error("Insert error:", error.message);
    }

    setBlockTime('');
    setBlockReason('');
    setBlockDays([]);
    setBlockEndDate('');
    await refreshAllData();
  };

  // Fetch bookings and blocked slots for selected date
  const fetchAppointmentsForSelectedDate = useCallback(async () => {
    const formattedDate = formatDate(selectedDate);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("date", formattedDate)
      .eq("status", "approved")
      .order("time", { ascending: true });

    const blocked = await fetchBlockedSlots(formattedDate);
    const combined = [
      ...bookings.map((b) => ({ ...b, type: "booking" })),
      ...blocked.map((b) => ({ ...b, type: "blocked" }))
    ];
    combined.sort((a, b) => (a.time > b.time ? 1 : -1));
    setAppointmentsByDate(combined);
  }, [selectedDate]);

  const fetchBookings = async () => {
    const { data } = await supabase.from("bookings").select("*").neq("status", "declined").order("date", { ascending: true }).limit(2);
    setUpcomingAppointments(data);
  };

  const fetchBookedDates = async () => {
    const { data: bookingDates } = await supabase.from("bookings").select("date").eq("status", "approved");
    const { data: blockedDates } = await supabase.from("blocked_slots").select("date");
    const allDates = [
      ...(bookingDates?.map(b => b.date) || []),
      ...(blockedDates?.map(b => b.date) || [])
    ];
    const uniqueDates = [...new Set(allDates.map(d => new Date(d).toISOString().split("T")[0]))];
    setBookedDates(uniqueDates);
  };

  const fetchUnconfirmedBookings = async () => {
    const { data } = await supabase.from("bookings").select("*").eq("status", "PENDING").order("date", { ascending: true });
    setUnconfirmedBookings(data);
  };

  // Show pink dot on dates with bookings or blocks
  const tileContent = ({ date }) => {
    const dateString = date.toISOString().split("T")[0];
    if (bookedDates.includes(dateString)) {
      return <div className="dot" style={{ backgroundColor: "pink", borderRadius: "50%", width: "5px", height: "5px", margin: "auto" }}></div>;
    }
    return null;
  };

  useEffect(() => {
    fetchBookings();
    fetchBookedDates();
  }, []);

  useEffect(() => {
    fetchAppointmentsForSelectedDate();
  }, [selectedDate, fetchAppointmentsForSelectedDate]);

  useEffect(() => {
    fetchUnconfirmedBookings();
  }, []);

  // Toggle selected weekday for recurrence
  const toggleDay = (day) => {
    setBlockDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Calendar */}
        <div className="md:w-1/2 bg-yellow-50 p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold mb-4">Kalender</h2>
          <Calendar onChange={setSelectedDate} value={selectedDate} tileContent={tileContent} />
        </div>

        {/* Blocking Form */}
        <div className="md:w-1/2 bg-white p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold mb-4">Lägg till blockering</h2>
          <form onSubmit={handleBlockSubmit} className="flex flex-col gap-2">
            <input type="time" value={blockTime} onChange={(e) => setBlockTime(e.target.value)} className="border p-2 rounded" required />
            <input type="text" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="border p-2 rounded" placeholder="Anledning" required />
            <div className="flex gap-2 items-center flex-wrap">
              {["M", "T", "O", "T", "F", "L", "S"].map((day, index) => (
                <button
                  key={index}
                  type="button"
                  className={`px-2 py-1 border rounded ${blockDays.includes(day) ? 'bg-blue-300' : 'bg-gray-100'}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            <input type="date" value={blockEndDate} onChange={(e) => setBlockEndDate(e.target.value)} className="border p-2 rounded" />
            <button type="submit" className="bg-red-300 hover:bg-red-400 text-black font-bold py-2 px-4 rounded">Blockera tid</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
