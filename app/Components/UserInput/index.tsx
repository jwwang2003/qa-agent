"use client"

import { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';

export default function UserInput() {
  const [userInput, setUserInput] = useState("");
  const [scrolling, setScrolling] = useState(false);
  const textareaRef = useRef(null);
  const maxRows = 5; // Set the maximum rows before scrolling is enabled

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User Input:", userInput);
    setUserInput(""); // Clear the input after submission.
  };

  const textAreaClass = classNames({
    "z-1 w-full min-h-fit p-2 border-2 border-gray-300 rounded-l-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-none ": true,
    // "overflow-hidden": !scrolling
  })

  return (
    <div className="rounded-lg shadow-lg w-full flex relative transition-all">
      <textarea
          ref={textareaRef}
          value={userInput}
          onChange={handleInputChange}
          placeholder="Ask anything"
          className={textAreaClass}
          rows={1} // Set the initial row count to 1
        />
      <button
        type="submit"
        onClick={handleSubmit}
        className="bg-gray-200 p-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-min"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12h18M12 3l9 9-9 9" />
        </svg>
      </button>
    </div>
  );
}
