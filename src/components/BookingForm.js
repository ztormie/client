import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase";
import { generateTimeSlots } from "../utils/generateSlots";
import emailjs from "@emailjs/browser";


export default function BookingForm({ service }) {
  const [emailSent, setEmailSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    message: "",
    date: "",
    time: "",
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  const fetchBookedSlots = useCallback(
    async (date) => {
      if (isNaN(Date.parse(date))) {
        console.error("Invalid date format:", date);
        return [];
      }
      const formattedDate = new Date(date).toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("bookings")
        .select("time")
        .eq("date", formattedDate)
        .eq("service_type", service);

      if (error) {
        console.error("Error fetching booked slots:", error.message);
        return [];
      }

      return data.map((booking) => booking.time);
    },
    [service]
  );

  useEffect(() => {
    if (form.date) {
      const selectedDate = new Date(form.date);
      const slots = generateTimeSlots(selectedDate);

      const loadAvailableSlots = async () => {
        const bookedSlots = await fetchBookedSlots(form.date);
        const formattedBooked = bookedSlots.map((slot) => slot.trim());
        const formattedAvailable = slots.map((slot) => slot.trim());
        const unbooked = formattedAvailable.filter(
          (slot) => !formattedBooked.includes(slot)
        );
        setAvailableSlots(unbooked);
      };

      loadAvailableSlots();
    }
  }, [form.date, service, fetchBookedSlots]);

  const isFormComplete =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    form.phone.trim() !== "" &&
    form.area.trim() !== "" &&
    form.date.trim() !== "" &&
    form.time.trim() !== "";

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted");

        if (!isFormComplete) return;

        const { error } = await supabase
            .from("bookings")
            .insert([{ ...form, service_type: service }]);

        if (error) {
            alert("Fel vid bokning: " + error.message);
        } else {
            console.log("Sending EmailJS Payload:", {
                name: form.name,
                email: form.email,
                ...
    });

            // Clear form after booking
            setForm({
                name: "",
                email: "",
                phone: "",
                area: "",
                message: "",
                date: "",
                time: "",
            });

            // Redirect after success
            window.location.href = "/bokning/bekräftelse";
        }
    };


  return (
    <form onSubmit={handleSubmit} className="bg-yellow-50 w-full max-w-3xl shadow-md rounded-xl p-6 mb-8 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Fyll i dina uppgifter:
      </h2>

      <input
        type="text"
        placeholder="Ditt namn"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-gray-300 p-2 rounded"
        required
      />

      <input
        type="email"
        placeholder="Din e-post"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full border border-gray-300 p-2 rounded"
        required
      />

      <input
        type="tel"
        placeholder="Telefonnummer"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full border border-gray-300 p-2 rounded"
        required
      />

      <input
        type="text"
        placeholder="Område (t.ex. Söndrums Centrum)"
        value={form.area}
        onChange={(e) => setForm({ ...form, area: e.target.value })}
        className="w-full border border-gray-300 p-2 rounded"
        required
      />

      <textarea
        placeholder="Meddelande (Vad behöver du hjälp med?)"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full border border-gray-300 p-2 rounded"
        rows="3"
      ></textarea>

      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        className="border border-gray-300 p-2 rounded w-full"
        required
      />

      {availableSlots.length > 0 && (
        <select
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          className="border border-gray-300 p-2 rounded w-full"
          required
        >
          <option value="">Välj tid</option>
          {availableSlots.map((slot, index) => (
            <option key={index} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={!isFormComplete}
        className={`${
          isFormComplete
            ? "bg-yellow-300 hover:bg-yellow-700 cursor-pointer"
            : "bg-gray-300 cursor-not-allowed"
        } text-gray-800 font-semibold py-2 px-4 rounded w-full`}
      >
        Boka tid
      </button>
    </form>
  );
}
