// src/pages/BookingConfirmationPage.js
import React from "react";

const BookingConfirmationPage = () => {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-md shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Tack för din bokning!</h1>
        <p className="text-md text-gray-700">Du kommer att få en bekräftelse via e-post inom kort.</p>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
