import React, { lazy, Suspense } from "react";
import './App.css';
import { Link } from "react-router-dom";
import framsidaImage from "./assets/framsida.png"; // Import the image
const AdminIcon = lazy(() => import("./components/AdminIcon")); // Lazy load AdminIcon

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fffaf4] flex flex-col items-center px-6 pt-10 text-center">

      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-1">
        Hjälpsamma Tjänster <span>🐶</span>
      </h1>

      {/* Service buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 mb-12 w-full max-w-2xl">
        <div className="bg-red-50 shadow-md rounded-xl p-4 h-60 flex flex-col items-center justify-center">
          <Link to="/bokning/hund" className="bg-yellow-200 hover:bg-yellow-300 text-orange-900 font-semibold py-2 px-4 rounded-xl text-center">
            Hundpassning
          </Link>
        </div>

        <div className="bg-red-50 shadow-md rounded-xl p-4 h-60 flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">👶</span>
          <Link to="/bokning/barn" className="bg-yellow-200 hover:bg-yellow-300 text-orange-900 font-semibold py-2 px-4 rounded-xl">
            Barnpassning
          </Link>
        </div>

        <div className="bg-red-50 shadow-md rounded-xl p-4 h-60 flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">🛒</span>
          <Link to="/bokning/arenden" className="bg-yellow-200 hover:bg-blue-200 text-orange-900 font-semibold py-2 px-4 rounded-xl">
            Hjälp med ärenden
          </Link>
        </div>
      </div>

      {/* Info text */}
      <p className="text-md text-gray-700 max-w-lg gap-4 mb-6">
        Hej! Vi är Stella och Isabel, systrar som älskar att hjälpa till i vårt
        område – oavsett om det är att rasta din hund, passa barnen eller utföra ärenden!
      </p>

      {/* Illustration */}
      <img
        src={framsidaImage}
        alt="Två tjejer med hund"
        className="h-auto rounded-2xl shadow-xl mb-10 w-full max-w-2xl"
      />

      {/* Admin Icon Link */}
      {/* The AdminIcon component provides a shortcut for administrators to access admin tools or settings. */}
      <Suspense fallback={<div>Loading admin tools...</div>}>
        <AdminIcon />
      </Suspense>
    </div>
  );
}
