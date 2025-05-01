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

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      }
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
    const { error } = await supabase
      .from('bookings')
      .update({
        date: editedDate,
        time: editedTime,
        message: editedMessage,
      })
      .eq('id', id);

    if (error) {
      console.error('Error saving changes:', error.message);
    } else {
      try {
        const emailPayload = {
          user_name: editingBooking.name,
          user_email: editingBooking.email,
          message: `📢 Bokningsändring 📢

Hej ${editingBooking.name},

Din bokning har ändrats!

Nya detaljer:
- 📅 Datum: ${editedDate}
- ⏰ Tid: ${editedTime}
- 📝 Meddelande: ${editedMessage}

Tack för att du använder Hjälpsamma Tjänster!

Vänliga hälsningar,
Stella och Isabel`
        };

        const result = await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          emailPayload,
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );

        console.log('Email sent successfully:', result.text);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      await refreshAllData();
      setEditingBooking(null);
    }
  };

  const approveBooking = async (id) => {
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: "approved" })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error approving booking:", error.message);
      return;
    }

    const booking = data[0];
    try {
      const result = await emailjs.send(
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

      console.log("Confirmation email sent:", result.text);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    await refreshAllData();
  };

  const declineBooking = async (id) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "declined" })
      .eq("id", id);

    if (error) {
      console.error("Error declining booking:", error.message);
    } else {
      await refreshAllData();
    }
  };

  const fetchUnconfirmedBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "PENDING")
      .order("date", { ascending: true });

    if (!error) {
      setUnconfirmedBookings(data);
    } else {
      console.error("Error fetching unconfirmed bookings:", error.message);
    }
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .neq("status", "declined")
      .order("date", { ascending: true })
      .limit(2);

    if (!error) setUpcomingAppointments(data);
    else console.error("Error fetching bookings:", error.message);
  };

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

  const fetchBookedDates = async () => {
    const { data: bookingDates } = await supabase
      .from("bookings")
      .select("date")
      .eq("status", "approved");

    const { data: blockedDates } = await supabase
      .from("blocked_slots")
      .select("date");

    const allDates = [
      ...(bookingDates?.map(b => b.date) || []),
      ...(blockedDates?.map(b => b.date) || []),
    ];

    const uniqueDates = [...new Set(allDates.map(date => {
      const d = new Date(date);
      return d.toISOString().split("T")[0];
    }))];

    setBookedDates(uniqueDates);
  };

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

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-white text-black p-2 text-center rounded-md shadow-md mb-4 mt-4 ml-4 mr-4">
        <h1 className="text-2xl font-bold">Boknings Översikt</h1>
      </header>

      {/* Place your existing layout blocks here if needed */}
    </div>
  );
};

export default AdminPage;
