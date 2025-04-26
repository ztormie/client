// src/pages/BookingConfirmationPage.js
import React from "react";

const BookingConfirmationPage = () => {
  setTimeout(() => {
    setEmailSent(false);
    window.location.href = "/bokning/bekräftelse";
  }, 2000);

  // Confirmation Page Content (example):
  return (
    <div className="confirmation-message">
      <h1 className="text-2xl font-bold text-green-600">🎉 Tack för din bokning! 🎉</h1>
      <p className="text-lg text-gray-700 mt-4">
        Vi ser fram emot att hjälpa dig! Du kommer snart att få en bekräftelse via e-post med alla detaljer om din bokning.
      </p>
      <p className="text-md text-gray-600 mt-2">
        Har du några frågor? Tveka inte att kontakta oss. Tack för att du valde oss!
      </p>
    </div>
  );
};

export default BookingConfirmationPage;
