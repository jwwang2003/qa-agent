"use client"

import { useState, useRef, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import classNames from 'classnames';

interface UserInputProps {
  onUserSubmit: (input: string) => void;
}

export default function UserInput({ onUserSubmit }: UserInputProps) {
  const [userInput, setUserInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxRows = 5; // Set the maximum rows before scrolling is enabled

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(e.target.value);
  };

  // Extract submission logic into a function that does not require an event.
  const submitInput = () => {
    if (userInput.trim() === "") return; // avoid submitting empty messages
    console.log("User Input:", userInput);
    onUserSubmit(userInput);
    setUserInput("");
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitInput();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // If Enter is pressed without Shift, prevent the newline and submit.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitInput();
    }
  };

  const textAreaClass = classNames({
    "z-1 w-full min-h-fit p-2 border-2 border-gray-300 rounded-l-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-none": true,
    // "overflow-hidden": !scrolling
  });

  return (
    <div className="rounded-lg shadow-lg w-full flex relative transition-all">
      <form onSubmit={handleSubmit} className="flex flex-1">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          className={textAreaClass}
          rows={1} // Set the initial row count to 1
        />
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-gray-200 p-2 !rounded-l-none rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-min"
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
      </form>
    </div>
  );
}
