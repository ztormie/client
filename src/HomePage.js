import React from "react";
import './App.css';
import { Link } from "react-router-dom";
import AdminIcon from "./components/AdminIcon";  // Ensure AdminIcon is correctly imported

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fffaf4] flex flex-col items-center px-6 pt-10 text-center">

      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6">
        Hjälpsamma Tjänster <span>🐶</span>
      </h1>

      {/* Illustration */}
      <img
        src="/framsida.png"
        alt="Två tjejer med hund"
        className="w-full max-w-xl h-auto rounded-2xl shadow-xl mb-6"
      />

      {/* Info text */}
      <p className="text-md text-gray-700 max-w-lg gap-4 mb-6">
        Hej! Vi är Stella och Isabel, systrar som älskar att hjälpa till i vårt
        område – oavsett om det är att rasta din hund, passa barnen eller utföra ärenden!
      </p>

      {/* Service buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 mb-12 w-full max-w-2xl">
        <div className="bg-red-50 shadow-md rounded-xl p-4 h-60 flex flex-col items-center justify-center transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <span className="text-3xl mb-2">🛒</span>
          <Link to="/bokning/arenden" className="bg-yellow-200 hover:bg-blue-200 text-amber-900 font-semibold py-2 px-4 rounded-xl">
            Hjälp med ärenden
          </Link>
        </div>
            
        <div className="bg-red-50 shadow-md rounded-xl p-4 h-60 flex flex-col items-center justify-center transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <span className="text-3xl mb-2">🐾</span>
          <Link to="/bokning/hund" className="bg-yellow-200 hover:bg-blue-200 text-orange-900 font-semibold py-2 px-4 rounded-xl text-center">
            Hundpassning
          </Link>
        </div>

        <div className="bg-red-50 shadow-md rounded-xl p-4 h-60 flex flex-col items-center justify-center transform transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <span className="text-3xl mb-2">👶</span>
          <Link to="/bokning/barn" className="bg-yellow-200 hover:bg-blue-200 text-orange-900 font-semibold py-2 px-4 rounded-xl">
            Barnpassning
          </Link>
        </div>

      </div>




      {/* Admin Icon Link */}
      <AdminIcon />
    </div>
  );
}
