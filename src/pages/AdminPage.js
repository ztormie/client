import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/AdminPage.css";
import { useNavigate } from 'react-router-dom'; // <-- NEW
import emailjs from '@emailjs/browser'
import { fetchBlockedSlots } from "../utils/blockedSlotsService";
import { useCallback } from "react"; // <-- Already imported useState etc. Just add useCallback if not there.



const AdminPage = () => {
  const navigate = useNavigate(); // <-- NEW
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) {
        navigate('/login'); // Redirect if not logged in
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
  const [blockDays, setBlockDays] = useState([]); // e.g. ['M', 'T']
  const [blockEndDate, setBlockEndDate] = useState('');
  


  const formatDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
  };

  const toggleDay = (day) => {
    setBlockDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
 

  const refreshAllData = async () => {
    await Promise.all([
      fetchBookings(),
      fetchAppointmentsForSelectedDate(),
      fetchBookedDates(),
      fetchUnconfirmedBookings() // ✅ added here
    ]);
  };
  
  const handleEditClick = (appointment) => {
    setEditingBooking(appointment);
    setEditedDate(appointment.date);
    setEditedTime(appointment.time);
    setEditedMessage(appointment.message || '');
  };
  
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
          type: 'recurring',
        });
        if (error) console.error("Recurring block error:", error.message);
      }
    } else {
      const { error } = await supabase.from('blocked_slots').insert({
        date: startDate,
        time: blockTime,
        reason: blockReason,
        type: 'once',
      });
      if (error) console.error("Single block error:", error.message);
    }
  
    setBlockTime('');
    setBlockReason('');
    setBlockDays([]);
    setBlockEndDate('');
    await refreshAllData();
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
      console.log('Booking updated! Sending confirmation email...');
  
      try {
        console.log('Trying to send email confirmation to:', editingBooking?.email);
        const emailPayload = {
          user_name: editingBooking.name, // 👈 important: use editingBooking
          user_email: editingBooking.email,
          message: `
            📢 Bokningsändring 📢

            Hej ${editingBooking.name},

            Din bokning har ändrats!

            Nya detaljer:
            - 📅 Datum: ${editedDate}
            - ⏰ Tid: ${editedTime}
            - 📝 Meddelande: ${editedMessage}

            Tack för att du använder Hjälpsamma Tjänster!

            Vänliga hälsningar,
            Stella och Isabel
          `
        };

        console.log('Email payload:', emailPayload);

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
  
      await refreshAllData(); // Refresh booking list
      setEditingBooking(null); // Close edit form
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
        console.log("Sending confirmation email for:", booking.email);

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


  // ✅ Decline a booking
  const declineBooking = async (id) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "declined" })
      .eq("id", id);

    if (error) {
      console.error("Error declining booking:", error.message);
      return;
    }

    await refreshAllData(); // 🔄 Refresh everything after update
  };

  // ✅ Fetch unconfirmed bookings
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
  
  // ✅ Fetch upcoming appointments
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

        const { data: bookings, error: bookingsError } = await supabase
            .from("bookings")
            .select("*")
            .eq("date", formattedDate)
            .eq("status", "approved")
            .order("time", { ascending: true });


        if (bookingsError) {
            console.error("Error fetching bookings:", bookingsError.message);
            return;
        }

        const blockedSlots = await fetchBlockedSlots(formattedDate);

        const combinedAppointments = [
            ...bookings.map((b) => ({ ...b, type: "booking" })),
            ...blockedSlots.map((b) => ({ ...b, type: "blocked" })),
        ];

        combinedAppointments.sort((a, b) => (a.time > b.time ? 1 : -1));

        setAppointmentsByDate(combinedAppointments);
    }, [selectedDate]); // 👈 depends on selectedDate



    const fetchBookedDates = async () => {
        const { data: bookingDates, error: bookingError } = await supabase
            .from("bookings")
            .select("date")
            .not("status", "eq", "approved")
            .neq("status", "declined");

        const { data: blockedDates, error: blockedError } = await supabase
            .from("blocked_slots")
            .select("date");

        if (bookingError || blockedError) {
            console.error("Error fetching dates:", bookingError?.message || blockedError?.message);
            return;
        }

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

    // ✅ Check if user is logged in
    useEffect(() => {
        async function checkAuth() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
            }
        }
        checkAuth();
    }, [navigate]);

    // ✅ Fetch bookings and calendar data when page loads
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

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="bg-white text-black p-2 text-center rounded-md shadow-md mb-4 mt-4 ml-4 mr-4">
        <h1 className="text-2xl font-bold">Boknings Översikt</h1>
      </header>

      {/* ✅ Kommande bokningar */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Kommande bokningar</h2>
        <div className="mb-6">
          <ul>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <li key={appointment.id} className="bg-white p-4 rounded-md shadow-md mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold">{appointment.name}</h3>
                      <p className="text-xs">{appointment.date}, {appointment.time}, {appointment.area}, {appointment.service_type}</p>
                      <p className="text-xs italic"> {appointment.message || "Inget meddelande"}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>No upcoming bookings.</li>
            )}
          </ul>
        </div>
      </div>

{/* ✅ Oconfirmade bokningar (PENDING) */}
<div className="p-4">
  <h2 className="text-xl font-semibold mb-4">Obekräftade bokningar</h2>
  <div className="mb-6">
    <ul>
      {unconfirmedBookings.length > 0 ? (
        unconfirmedBookings.map((booking) => (
          <li key={booking.id} className="bg-white p-4 rounded-md shadow-md mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold">{booking.name}</h3>
                <p className="text-xs">{booking.date}, {booking.time}</p>
                <p className="text-xs">{booking.area}</p>
                <p className="font-semibold text-sm text-yellow-500">{booking.status}</p>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  className="text-xs bg-green-200 text-black py-2 px-4 rounded-md font-bold"
                  onClick={() => approveBooking(booking.id)}
                >
                  Godkänn
                </button>
                <button
                  className="text-xs bg-red-200 text-black py-2 px-4 rounded-md font-bold"
                  onClick={() => declineBooking(booking.id)}
                >
                  Avvisa
                </button>
              </div>
            </div>
          </li>
        ))
      ) : (
        <li>Inga obekräftade bokningar.</li>
      )}
    </ul>
  </div>
</div>




{/* ✅ Kalender och blockeringar */}
<div className="p-4 flex flex-col md:flex-row gap-4">
  {/* Calendar column */}
  <div className="md:w-1/2 bg-yellow-50 p-4 rounded-md shadow-md">
    <h2 className="text-xl font-semibold mb-4">Kalender</h2>
    <Calendar
      onChange={setSelectedDate}
      value={selectedDate}
      tileContent={tileContent}
    />
  </div>

  {/* Blocking form column */}
  <div className="md:w-1/2 bg-white p-4 rounded-md shadow-md">
    <h2 className="text-xl font-semibold mb-4">Lägg till blockering</h2>
    <form onSubmit={handleBlockSubmit} className="flex flex-col gap-2">
      <input
        type="time"
        value={blockTime}
        onChange={(e) => setBlockTime(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <input
        type="text"
        value={blockReason}
        onChange={(e) => setBlockReason(e.target.value)}
        className="border p-2 rounded"
        placeholder="Anledning"
        required
      />
      {/* Recurring weekdays */}
      <div className="flex gap-2 items-center flex-wrap">
        {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((day, index) => (
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
      {/* Optional end date for recurring */}
      <input
        type="date"
        value={blockEndDate}
        onChange={(e) => setBlockEndDate(e.target.value)}
        className="border p-2 rounded"
      />
      <button
        type="submit"
        className="bg-red-300 hover:bg-red-400 text-black font-bold py-2 px-4 rounded"
      >
        Blockera tid
      </button>
    </form>
  </div>
</div>


      {/* ✅ Bokningar för valt datum */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-4">Bokningar för {selectedDate.toLocaleDateString()}</h2>
        <div className="mb-6">
          <ul>
          {appointmentsByDate.length > 0 ? (
            appointmentsByDate.map((appointment) => (
              <li key={appointment.id} className="bg-white p-4 rounded-md shadow-md mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold">{appointment.name}</h3>
                      <p className="text-xs">{appointment.date}, {appointment.time}</p>
                      <p className="text-xs">{appointment.area}</p>
                      <p className="font-semibold text-sm text-yellow-500">{appointment.status}</p>
                    </div>
                    <button
                      className="text-xs bg-blue-200 text-black py-2 px-4 rounded-md font-bold"
                      onClick={() => handleEditClick(appointment)}
                    >
                      Ändra
                    </button>
                  </div>

                  {/* Expanded form if editing */}
                  {editingBooking?.id === appointment.id && (
                    <div className="mt-4 p-2 border rounded bg-gray-100">
                      <input
                        type="date"
                        value={editedDate}
                        onChange={(e) => setEditedDate(e.target.value)}
                        className="border p-2 w-full mb-2 rounded"
                      />
                      <input
                        type="time"
                        value={editedTime}
                        onChange={(e) => setEditedTime(e.target.value)}
                        className="border p-2 w-full mb-2 rounded"
                      />
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        placeholder="Meddelande"
                        className="border p-2 w-full mb-2 rounded"
                      ></textarea>
                      <button
                        className="bg-green-300 hover:bg-green-400 text-black font-bold py-2 px-4 rounded"
                        onClick={() => saveChanges(appointment.id)}
                      >
                        Spara ändringar
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li>Inga bokningar för detta datum.</li>
          )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;