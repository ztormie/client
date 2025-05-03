import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/AdminPage.css";
import { useNavigate } from 'react-router-dom'; // <-- NEW
import emailjs from '@emailjs/browser'
import { fetchBlockedSlots } from "../utils/blockedSlotsService";
import { useCallback } from "react"; // <-- Already imported useState etc. Just add useCallback if not there.
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid'; // 🧠 Top of file, install uuid if not yet


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
  const [blockReason, setBlockReason] = useState('');
  const [blockDays, setBlockDays] = useState([]); // e.g. ['M', 'T']
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('');
  const [blockEndTime, setBlockEndTime] = useState('');
  const [editingBlock, setEditingBlock] = useState(null);
  const [editedBlockStart, setEditedBlockStart] = useState('');
  const [editedBlockEnd, setEditedBlockEnd] = useState('');
  const [editedBlockReason, setEditedBlockReason] = useState('');


  
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      ["00", "30"].forEach((minute) => {
        times.push(`${hour.toString().padStart(2, "0")}:${minute}`);
      });
    }
    return times;
  };
  

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
  
    // ⛔ Kontrollera om tider är hel- eller halvtimme
    const isValidTime = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return minutes === 0 || minutes === 30;
    };
  
    if (!isValidTime(blockStartTime) || !isValidTime(blockEndTime)) {
      alert("Tider måste vara hel- eller halvtimmar, t.ex. 09:00 eller 09:30.");
      return;
    }
  
    const startDate = new Date(selectedDate);
    const endDate = blockEndDate ? new Date(blockEndDate) : null;
    const formattedStartDate = formatDate(startDate);
  
    const dayMap = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
  
    const selectedDays = blockDays.map((day) => dayMap[day]);
    const blockEntries = [];
  
    if (selectedDays.length > 0 && endDate) {
      let currentDate = new Date(startDate);
  
      while (currentDate <= endDate) {
        const currentDay = currentDate.getDay(); // 0–6 (Sun–Sat)
        if (selectedDays.includes(currentDay)) {
          blockEntries.push({
            date: formatDate(currentDate),
            start_time: blockStartTime,
            end_time: blockEndTime,
            reason: blockReason,
            type: 'recurring',
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // 🔒 Enstaka blockering
      blockEntries.push({
        date: formattedStartDate,
        start_time: blockStartTime,
        end_time: blockEndTime,
        reason: blockReason,
        type: 'once',
      });
    }
  
    const { error } = await supabase.from('blocked_slots').insert(blockEntries);
  
    if (error) {
      console.error("Block insert error:", error.message);
    } else {
      console.log(`✅ Inserted ${blockEntries.length} block(s)`);
      setBlockStartTime('');
      setBlockEndTime('');
      setBlockReason('');
      setBlockDays([]);
      setBlockEndDate('');
      await refreshAllData();
    }
  };
  


  const saveBlockChanges = async (id) => {
    const { error } = await supabase
      .from('blocked_slots')
      .update({
        start_time: editedBlockStart,
        end_time: editedBlockEnd,
        reason: editedBlockReason,
      })
      .eq('id', id);
  
    if (error) {
      console.error("Failed to update block:", error.message);
    } else {
      console.log("⛔ Block updated");
      setEditingBlock(null);
      setEditedBlockStart('');
      setEditedBlockEnd('');
      setEditedBlockReason('');
      await refreshAllData();
    }
  };
  
  const deleteBooking = async (id) => {
    const confirmDelete = window.confirm("Är du säker på att du vill ta bort bokningen?");
    if (!confirmDelete) return;
  
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);
  
    if (error) {
      console.error("Kunde inte ta bort bokningen:", error.message);
    } else {
      console.log("📆 Bokning borttagen");
      await refreshAllData(); // Ladda om datan
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
      console.log('Booking updated! Sending confirmation email...');
  
      try {
        console.log('Trying to send email confirmation to:', editingBooking?.email);
        const emailPayload = {
          user_name: editingBooking.name,
          user_email: editingBooking.email,
          booking_date: editedDate,    // 🟢 detta behövs om du har {{booking_date}} i mallen
          booking_time: editedTime,    // 🟢 detta behövs om du har {{booking_time}} i mallen
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
    
    const declineBooking = async (booking) => {
      const reason = window.prompt("Ange anledning till avvisning:");
      if (!reason) return;
    
      const { error } = await supabase
        .from("bookings")
        .update({ status: "declined", decline_reason: reason })
        .eq("id", booking.id);
    
      if (error) {
        console.error("Error declining booking:", error.message);
        return;
      }
        
      try {
        const result = await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_DECLINE_TEMPLATE_ID,
          {
            user_name: booking.name,
            user_email: booking.email,
            booking_date: booking.date,
            booking_time: booking.time,
            decline_reason: reason,
          },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
    
        console.log("Decline email sent:", result.text);
      } catch (emailError) {
        console.error("Failed to send decline email:", emailError);
      }
    
      await refreshAllData();
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
  
const fetchBookings = async () => {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .neq("status", "declined")
    .gte("date", today) // 👈 visar endast framtida eller dagens bokningar
    .order("date", { ascending: true });

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
        .select("date, type, day_of_week, end_date");
    
      if (bookingError || blockedError) {
        console.error("Error fetching dates:", bookingError?.message || blockedError?.message);
        return;
      }
    
      let allDates = bookingDates?.map(b => b.date) || [];
    
      blockedDates?.forEach((block) => {
        if (block.type === "once") {
          allDates.push(block.date);
        } else if (block.type === "recurring" && block.date && block.end_date && block.day_of_week) {
          const from = parseISO(block.date);
          const to = parseISO(block.end_date);
    
          const weekdays = {
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
            Sun: 0,
          };
    
          const blockWeekday = weekdays[block.day_of_week];
    
          const dates = eachDayOfInterval({ start: from, end: to });
          dates.forEach((d) => {
            if (d.getDay() === blockWeekday) {
              allDates.push(format(d, "yyyy-MM-dd"));
            }
          });
        }
      });
    
      const uniqueDates = [...new Set(allDates)];
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

    const deleteBlock = async (id) => {
      const confirm = window.confirm("Är du säker på att du vill ta bort blockeringen?");
      if (!confirm) return;
    
      const { error } = await supabase
        .from('blocked_slots')
        .delete()
        .eq('id', id);
    
      if (error) {
        console.error("Fel vid borttagning av blockering:", error.message);
      } else {
        console.log("⛔ Blockering borttagen");
        await refreshAllData(); // Laddar om så att den försvinner från listan
      }
    };
    
    

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
                  onClick={() => declineBooking(booking)}

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
  <div className="md:w-1/2 bg-white p-4 rounded-md shadow-md flex flex-col items-center">
    <h2 className="text-xl font-semibold mb-4 self-start">Kalender</h2>
    <Calendar
      onChange={setSelectedDate}
      value={selectedDate}
      tileContent={tileContent}
      className="w-full rounded-md"
    />
  </div>


  {/* Blocking form column */}
  <div className="md:w-1/2 bg-white p-4 rounded-md shadow-md">
    <h2 className="text-xl font-semibold mb-4">Lägg till blockering</h2>
    <form onSubmit={handleBlockSubmit} className="flex flex-col gap-2">
      
      {/* Time range */}
      <div className="flex gap-2">
        <div className="flex flex-col w-1/2">
          <label className="text-sm font-medium mb-1">Från</label>
          <select
            value={blockStartTime}
            onChange={(e) => setBlockStartTime(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Välj starttid</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col w-1/2">
          <label className="text-sm font-medium mb-1">Till</label>
          <select
            value={blockEndTime}
            onChange={(e) => setBlockEndTime(e.target.value)}
            className="border p-2 rounded"
            required
          >
            <option value="">Välj starttid</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>

        </div>
      </div>

      <input
        type="text"
        value={blockReason}
        onChange={(e) => setBlockReason(e.target.value)}
        className="border p-2 rounded"
        placeholder="Anledning"
        required
      />

      {/* Recurring options block */}
      <div className="border border-dashed p-2 rounded-md bg-gray-50">
        <label className="text-sm font-medium text-gray-600">Återkommande dagar:</label>
        <div className="flex gap-2 items-center flex-wrap mt-1 mb-2">
          {[
            { label: "M", value: "Mon" },
            { label: "T", value: "Tue" },
            { label: "O", value: "Wed" },
            { label: "T", value: "Thu" },
            { label: "F", value: "Fri" },
            { label: "L", value: "Sat" },
            { label: "S", value: "Sun" }
          ].map((day, index) => (
            <button
              key={index}
              type="button"
              className={`px-2 py-1 border rounded ${
                blockDays.includes(day.value) ? 'bg-blue-300' : 'bg-gray-100'
              }`}
              onClick={() =>
                setBlockDays((prev) =>
                  prev.includes(day.value)
                    ? prev.filter((d) => d !== day.value)
                    : [...prev, day.value]
                )
              }
            >
              {day.label}
            </button>
          ))}
        </div>

        <label className="text-sm font-medium text-gray-600">Slutdatum (för återkommande):</label>
        <input
          type="date"
          value={blockEndDate}
          onChange={(e) => setBlockEndDate(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

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
        <h2 className="text-xl font-semibold mb-4">
          Bokningar för {selectedDate.toLocaleDateString()}
        </h2>
        <div className="mb-6">
          <ul>
          {appointmentsByDate.length > 0 ? (
            appointmentsByDate.map((item) => (
              <li key={item.id} className="bg-white p-4 rounded-md shadow-md mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div>
                      {item.type === "booking" ? (
                        <>
                          <h3 className="text-sm font-semibold">{item.name}</h3>
                          <p className="text-xs">
                            {item.date}, {item.time}
                          </p>
                          <p className="text-xs">{item.area}</p>
                          <p className="font-semibold text-sm text-yellow-500">
                            {item.status}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold text-red-500">⛔ Blockerad tid</h3>
                          <p className="text-xs">
                            {item.date}, {item.start_time} - {item.end_time}
                          </p>
                          <p className="text-xs italic">{item.reason}</p>
                          {item.type === "recurring" && (
                            <p className="text-xs text-gray-500 italic">
                              Återkommande ({item.day_of_week}) till {item.end_date}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {item.type === "booking" ? (
                      <div className="flex flex-col space-y-2">
                        <button
                          className="text-xs bg-blue-200 text-black py-2 px-4 rounded-md font-bold"
                          onClick={() => handleEditClick(item)}
                        >
                          Ändra
                        </button>
                        <button
                          className="text-xs bg-red-200 text-black py-2 px-4 rounded-md font-bold"
                          onClick={() => deleteBooking(item.id)}
                        >
                          Ta bort
                        </button>
                      </div>
                    ) : (
                    <div className="flex flex-col space-y-2">
                      <button
                        className="text-xs bg-blue-200 text-black py-2 px-4 rounded-md font-bold"
                        onClick={() => {
                          setEditingBlock(item);
                          setEditedBlockStart(item.start_time || '');
                          setEditedBlockEnd(item.end_time || '');
                          setEditedBlockReason(item.reason || '');
                        }}
                      >
                        Ändra
                      </button>
                      <button
                        className="text-xs bg-red-200 text-black py-2 px-4 rounded-md font-bold"
                        onClick={() => {
                          console.log("👉 Försöker ta bort ID:", item.id);
                          deleteBlock(item.id);
                        }}
                      >
                        Ta bort
                      </button>
                    </div>
                  )}
                  </div>
                  
                  {editingBooking?.id === item.id && (
                    <div className="mt-4 p-2 border rounded bg-gray-100">
                      <input
                        type="date"
                        value={editedDate}
                        onChange={(e) => setEditedDate(e.target.value)}
                        className="border p-2 w-full mb-2 rounded"
                      />
                      <select
                        value={editedTime}
                        onChange={(e) => setEditedTime(e.target.value)}
                        className="border p-2 w-full mb-2 rounded"
                      >
                        <option value="">Välj tid</option>
                        {generateTimeOptions().map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        placeholder="Meddelande"
                        className="border p-2 w-full mb-2 rounded"
                      ></textarea>
                      <button
                        className="bg-green-300 hover:bg-green-400 text-black font-bold py-2 px-4 rounded"
                        onClick={() => saveChanges(item.id)}
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