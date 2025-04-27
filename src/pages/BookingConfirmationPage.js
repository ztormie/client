// src/pages/BookingConfirmationPage.js
import React from "react";

const BookingConfirmationPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-yellow-200 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-md w-full">
                <h1 className="text-3xl font-extrabold text-green-600 mb-4 animate-bounce">
                    🎉 Tack för din bokning!
                </h1>
                <p className="text-md text-gray-800 mb-4">
                    Vi är så glada att du vill hjälp av oss! 🌟
                </p>
                <p className="text-md text-gray-700 mb-6">
                    Din förfrågan har tagits emot och vi återkommer med bekräftelse via e-post så snart vi kan.
                </p>
                <p className="text-sm text-gray-500 italic mb-8">
                    Tack för att du kontaktar oss!🐾
                </p>
                <a
                    href="/"
                    className="inline-block bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-full shadow-md transition-all duration-300"
                >
                    Tillbaka till startsidan
                </a>
            </div>
        </div>
    );
};

export default BookingConfirmationPage;
