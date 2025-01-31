import React, { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  return (
    <div
      className={`fixed bottom-5 left-1/2 transform -translate-x-1/2 p-4 bg-blue-500 text-white rounded-lg transition-all duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      {message}
    </div>
  );
};

export default Toast;