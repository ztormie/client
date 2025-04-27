// src/pages/BookingConfirmationPage.js
import React from "react";
import Confetti from "react-confetti";
import { useWindowSize } from '@react-hook/window-size'; // Add this line

const BookingConfirmationPage = () => {
    const [width, height] = useWindowSize(); // Dynamically get window size for confetti

    return (
        <div className="min-h-screen bg-gradient-to-r from-yellow-100 to-yellow-300 flex items-center justify-center relative overflow-hidden">
            <Confetti width={width} height={height} numberOfPieces={200} /> {/* 🎉 Add this */}
            <div className="bg-white p-8 rounded-xl shadow-lg text-center z-10">
                <h1 className="text-3xl font-extrabold text-green-600 mb-4">
                      Tack för din bokning! 🎉
                </h1>
                <p className="text-lg text-gray-800 mb-6">
                    Vi är glada att du kontaktar oss för att hjälpa dig! En bekräftelse skickas till din e-post när bokningen är bekräftad av oss.
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
