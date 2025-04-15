// src/components/AdminIcon.js
import React from "react";
import { Link } from "react-router-dom";  // To navigate to the admin page

const AdminIcon = () => {
  return (
    <Link to="/admin" className="fixed bottom-4 right-4 p-4 bg-blue-500 text-white rounded-full shadow-lg">
      <span>Admin</span>
    </Link>
  );
};

export default AdminIcon;
