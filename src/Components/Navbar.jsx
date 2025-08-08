import React from "react";
import { useAuth } from "../context/AuthContext";
import PreLoginNavbar from "./PreLogin";
import PostLoginNavbar from "./PostLogin";

const Navbar = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <PostLoginNavbar /> : <PreLoginNavbar />;
};

export default Navbar;