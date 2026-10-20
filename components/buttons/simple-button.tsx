import React from "react";

// Define the type for the component props
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// Functional Component
export default function Button({ onClick, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
    >
      {children}
    </button>
  );
}
