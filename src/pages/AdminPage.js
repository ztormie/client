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

  // State variables for various appointment data and form inputs
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
  const [blockType, setBlockType] = useState('once');
  const [blockedSlots, setBlockedSlots] = useState([]);

  // Ensure the user is authenticated; redirect if not
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate('/login');
    }
    checkAuth();
  }, [navigate]);

  // Format a JS date to yyyy-mm-dd
  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  };

  // Refresh all relevant data from the database
  const refreshAllData = async () => {
    await Promise.all([
      fetchBookings(),
      fetchAppointmentsForSelectedDate(),
      fetchBookedDates(),
      fetchUnconfirmedBookings()
    ]);
  };

  // Prepare booking info for editing
  const handleEditClick = (appointment) => {
    setEditingBooking(appointment);
    setEditedDate(appointment.date);
    setEditedTime(appointment.time);
    setEditedMessage(appointment.message || '');
  };

  // Add a new blocked time slot
  const handleBlockTimeSubmit = async (e) => {
    e.preventDefault();
    const date = formatDate(selectedDate);
    const { error } = await supabase.from('blocked_slots').insert({
      date,
      time: blockTime,
      reason: blockReason,
      type: blockType
    });
    if (error) {
      console.error('Block error:', error.message);
    } else {
      setBlockTime('');
      setBlockReason('');
      setBlockType('once');
      await refreshAllData();
    }
  };

  // Remove an existing blocked time
  const handleRemoveBlockedSlot = async (blockedSlotId) => {
    const { error } = await supabase.from('blocked_slots').delete().eq('id', blockedSlotId);
    if (error) {
      console.error('Error removing blocked slot:', error.message);
    } else {
      await refreshAllData();
    }
  };

  // Fetch appointments and blocked slots for the selected date
  const fetchAppointmentsForSelectedDate = useCallback(async () => {
    const formattedDate = formatDate(selectedDate);
    const { data: bookings, error: bookingsError } = await supabase
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

  // Fetch all bookings to display upcoming ones
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .neq("status", "declined")
      .order("date", { ascending: true })
      .limit(2);
    if (!error) setUpcomingAppointments(data);
  };

  // Fetch all booked and blocked dates to mark the calendar
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

  // Fetch all pending bookings
  const fetchUnconfirmedBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "PENDING")
      .order("date", { ascending: true });
    if (!error) setUnconfirmedBookings(data);
  };

  // Display dots on calendar for booked dates
  const tileContent = ({ date }) => {
    const dateString = date.toISOString().split("T")[0];
    if (bookedDates.includes(dateString)) {
      return <div className="dot" style={{ backgroundColor: "pink", borderRadius: "50%", width: "5px", height: "5px", margin: "auto" }}></div>;
    }
    return null;
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchBookings();
    fetchBookedDates();
  }, []);

  // Fetch appointments when date changes
  useEffect(() => {
    fetchAppointmentsForSelectedDate();
  }, [selectedDate, fetchAppointmentsForSelectedDate]);

  // Fetch pending bookings on mount
  useEffect(() => {
    fetchUnconfirmedBookings();
  }, []);

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* ✅ Blockering Panel bredvid kalendern */}
      <div className="flex flex-col md:flex-row gap-4 p-4">
        <div className="md:w-1/2 bg-yellow-50 p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold mb-4">Kalender</h2>
          <Calendar onChange={setSelectedDate} value={selectedDate} tileContent={tileContent} />
        </div>

        <div className="md:w-1/2 bg-white p-4 rounded-md shadow-md">
          <h2 className="text-xl font-semibold mb-4">Lägg till blockering</h2>
          <form onSubmit={handleBlockTimeSubmit} className="flex flex-col gap-2">
            <input
              type="time"
              className="border p-2 rounded"
              value={blockTime}
              onChange={(e) => setBlockTime(e.target.value)}
              required
            />
            <input
              type="text"
              className="border p-2 rounded"
              placeholder="Anledning"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              required
            />
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="once">Engångs</option>
              <option value="recurring">Återkommande</option>
            </select>
            <button type="submit" className="bg-red-300 hover:bg-red-400 text-black font-bold py-2 px-4 rounded">
              Blockera tid
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
