// src/App.js
import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import HomePage from "./HomePage";
import BookingPage from "./bookingpage";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";


function App() {
  const [, setUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("bookings").select("*");

      if (error) {
        console.error("Supabase error:", error.message);
      } else {
        setUsers(data);
      }
    };

    
    fetchData();
  }, []);

  return (
    <Router>
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/admin" element={<AdminPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/bokning/:service" element={<BookingPage />} />
  <Route path="/bokning/bekräftelse" element={<BookingConfirmationPage />} />
</Routes>
      
    </Router>
  );
}

export default App;
