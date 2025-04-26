// src/pages/BookingConfirmationPage.js
import React from "react";

const BookingConfirmationPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-yellow-100 to-yellow-300 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-extrabold text-green-600 mb-4">
          🎉 Tack för din bokning! 🎉
        </h1>
        <p className="text-lg text-gray-800 mb-6">
          Vi är glada att få hjälpa dig! En bekräftelse har skickats till din e-post.
        </p>
        <p className="text-md text-gray-600">
          Har du några frågor? Tveka inte att kontakta oss. Vi ser fram emot att träffa dig!
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300"
          >
            Tillbaka till startsidan
          </a>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
