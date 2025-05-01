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
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      }
    }
    checkAuth();
  }, [navigate]);

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

  const handleEditClick = (appointment) => {
    setEditingBooking(appointment);
    setEditedDate(appointment.date);
    setEditedTime(appointment.time);
    setEditedMessage(appointment.message || '');
  };

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

  const handleRemoveBlockedSlot = async (blockedSlotId) => {
    const { error } = await supabase.from('blocked_slots').delete().eq('id', blockedSlotId);
    if (error) {
      console.error('Error removing blocked slot:', error.message);
    } else {
      await refreshAllData();
    }
  };

  const saveChanges = async (id) => {
    const { error } = await supabase.from('bookings').update({
      date: editedDate,
      time: editedTime,
      message: editedMessage,
    }).eq('id', id);

    if (error) {
      console.error('Error saving changes:', error.message);
    } else {
      try {
        const emailPayload = {
          user_name: editingBooking.name,
          user_email: editingBooking.email,
          message: `📢 Bokningsändring 📢\n\nHej ${editingBooking.name},\n\nDin bokning har ändrats!\n\nNya detaljer:\n- 📅 Datum: ${editedDate}\n- ⏰ Tid: ${editedTime}\n- 📝 Meddelande: ${editedMessage}\n\nTack för att du använder Hjälpsamma Tjänster!\n\nVänliga hälsningar,\nStella och Isabel`
        };

        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          emailPayload,
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      await refreshAllData();
      setEditingBooking(null);
    }
  };

  const approveBooking = async (id) => {
    const { data, error } = await supabase.from("bookings").update({ status: "approved" }).eq("id", id).select();
    if (error) return console.error("Error approving booking:", error.message);

    const booking = data[0];
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          user_name: booking.name,
          user_email: booking.email,
          booking_date: booking.date,
          booking_time: booking.time,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }
    await refreshAllData();
  };

  const declineBooking = async (id) => {
    const { error } = await supabase.from("bookings").update({ status: "declined" }).eq("id", id);
    if (error) return console.error("Error declining booking:", error.message);
    await refreshAllData();
  };

  const fetchUnconfirmedBookings = async () => {
    const { data, error } = await supabase.from("bookings").select("*").eq("status", "PENDING").order("date", { ascending: true });
    if (!error) setUnconfirmedBookings(data);
    else console.error("Error fetching unconfirmed bookings:", error.message);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase.from("bookings").select("*").neq("status", "declined").order("date", { ascending: true }).limit(2);
    if (!error) setUpcomingAppointments(data);
    else console.error("Error fetching bookings:", error.message);
  };

  const fetchAppointmentsForSelectedDate = useCallback(async () => {
    const formattedDate = formatDate(selectedDate);
    const { data: bookings, error: bookingsError } = await supabase.from("bookings").select("*").eq("date", formattedDate).eq("status", "approved").order("time", { ascending: true });
    const blocked = await fetchBlockedSlots(formattedDate);
    const combined = [
      ...bookings.map((b) => ({ ...b, type: "booking" })),
      ...blocked.map((b) => ({ ...b, type: "blocked" }))
    ];
    combined.sort((a, b) => (a.time > b.time ? 1 : -1));
    setAppointmentsByDate(combined);
  }, [selectedDate]);

  const fetchBookedDates = async () => {
    const { data: bookingDates, error: bookingError } = await supabase.from("bookings").select("date").not("status", "eq", "approved").neq("status", "declined");
    const { data: blockedDates, error: blockedError } = await supabase.from("blocked_slots").select("date");
    if (bookingError || blockedError) return console.error("Error fetching dates:", bookingError?.message || blockedError?.message);

    const allDates = [...(bookingDates?.map(b => b.date) || []), ...(blockedDates?.map(b => b.date) || [])];
    const uniqueDates = [...new Set(allDates.map(date => new Date(date).toISOString().split("T")[0]))];
    setBookedDates(uniqueDates);
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

  const tileContent = ({ date }) => {
    const dateString = date.toISOString().split("T")[0];
    if (bookedDates.includes(dateString)) {
      return <div className="dot" style={{ backgroundColor: "pink", borderRadius: "50%", width: "5px", height: "5px", margin: "auto" }}></div>;
    }
    return null;
  };

  return <></>; // UI goes here (unchanged)
};

export default AdminPage;
