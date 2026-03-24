import React from "react";
import Navbar from "@/Components/Navbar";
const UserLayout = ({ children }) => {
  return <div>
    <Navbar/>
    {children}</div>
};

export default UserLayout;
