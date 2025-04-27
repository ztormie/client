import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/AdminPage.css";
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

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
            fetchUnconfirmedBookings(),
        ]);
    };

    const handleEditClick = (appointment) => {
        setEditingBooking(appointment);
        setEditedDate(appointment.date);
        setEditedTime(appointment.time);
        setEditedMessage(appointment.message || '');
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
            console.log('Booking updated successfully');
            await refreshAllData();
            setEditingBooking(null);
        }
    };

    // ✅ Updated: approve booking and send confirmation email
    const approveBooking = async (booking) => {
        const { error } = await supabase
            .from("bookings")
            .update({ status: "approved" })
            .eq("id", booking.id)
            .select();

        if (error) {
            console.error("Error approving booking:", error.message);
            return;
        }

        console.log("Sending confirmation email for:", booking.email);

        try {
            const result = await emailjs.send(
                process.env.REACT_APP_EMAILJS_SERVICE_ID,
                process.env.REACT_APP_EMAILJS_CONFIRMATION_TEMPLATE_ID, // 👈 template adapted
                {
                    user_name: booking.name,
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
            return;
        }

        await refreshAllData();
    };

    const fetchUnconfirmedBookings = async () => {
        const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("status", "PENDING")
            .order("date", { ascending: true });

        if (!error) setUnconfirmedBookings(data);
        else console.error("Error fetching unconfirmed bookings:", error.message);
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

    const fetchAppointmentsForSelectedDate = async () => {
        const formattedDate = formatDate(selectedDate);
        const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("date", formattedDate)
            .neq("status", "declined")
            .order("time", { ascending: true });

        if (!error) setAppointmentsByDate(data);
        else console.error("Error fetching by date:", error.message);
    };

    const fetchBookedDates = async () => {
        const { data, error } = await supabase
            .from("bookings")
            .select("date")
            .not("status", "eq", "approved")
            .neq("status", "declined");

        if (!error) {
            const dates = data.map((booking) => {
                const date = new Date(booking.date);
                const adjustedDate = new Date(date.setHours(0, 0, 0, 0));
                return adjustedDate.toISOString().split("T")[0];
            });
            setBookedDates(dates);
        } else {
            console.error("Error fetching booked dates:", error.message);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchBookedDates();
    }, []);

    useEffect(() => {
        fetchAppointmentsForSelectedDate();
    }, [selectedDate]);

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

            {/* Upcoming Bookings */}
            <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Kommande bokningar</h2>
                <div className="mb-6">
                    <ul>
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map((appointment) => (
                                <li key={appointment.id} className="bg-white p-4 rounded-md shadow-md mb-4">
                                    <div>
                                        <h3 className="text-sm font-semibold">{appointment.name}</h3>
                                        <p className="text-xs">{appointment.date}, {appointment.time}, {appointment.area}, {appointment.service_type}</p>
                                        <p className="text-xs italic">{appointment.message || "Inget meddelande"}</p>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li>Inga kommande bokningar.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Pending Bookings */}
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
                                                onClick={() => approveBooking(booking)}
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

            {/* Calendar */}
            <div className="calendar-container p-4">
                <h2 className="text-xl font-semibold mb-4">Kalender</h2>
                <div className="bg-yellow-50 p-4 rounded-md shadow-md">
                    <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        tileContent={tileContent}
                    />
                </div>
            </div>

            {/* Bookings for selected date */}
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

                                        {/* Edit form */}
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
