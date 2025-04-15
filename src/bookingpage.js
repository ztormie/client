// src/bookingpage.js
import React from "react";
import { useParams } from "react-router-dom";
import BookingForm from "./components/BookingForm";

export default function BookingPage() {
  const { service } = useParams(); // Get "hund", "barn" or "arenden"

  const titles = {
    hund: "Boka hundpassning",
    barn: "Boka barnpassning",
    arenden: "Boka hjälp med ärenden",
  };

  const descriptions = {
    hund: ["Rasta hunden efter skolan", "Leka och ge sällskap", "Kvällspromenader"],
    barn: ["Passa barn kvällstid eller helg", "Hjälpa till med läxor", "Leka och hålla sällskap hemma"],
    arenden: ["Handla matvaror", "Hämta paket", "Lämna saker till återvinning"],
  };

  const title = titles[service] || "Boka Tjänst";
  const descriptionList = descriptions[service] || [];


  
  return (
    <div className="min-h-screen bg-[#fffaf4] flex flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-6">{title}</h1>

      {/* Render the form from external component */}
      <BookingForm service={service} />

      {/* Beskrivande text */}
      <div className="bg-yellow-50 w-full max-w-3xl shadow-md rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Exempel:</h2>
        <ul className="list-disc list-inside text-gray-700">
          {descriptionList.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>


      {/* Bild */}
      <div className="w-full max-w-3xl">
        <img src="/framsida.png" alt="Två tjejer med hund" className="w-full rounded-xl shadow-xl" />
      </div>
    </div>
  );

  
}
