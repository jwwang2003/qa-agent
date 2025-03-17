"use client";

import { useState, Dispatch, SetStateAction } from "react";
import UserInput from "../UserInput";
import Response, { GenerateAnswerAPI } from "../Response";
import Query from "../Query";
import { PDFFile } from "@/Components/Document";

export enum MessageType {
  USER,
  SERVER
}

export interface Message {
  type: MessageType;
  content: string;
}

export interface ChatboxParams {
  doc: PDFFile | undefined;
  setDoc: Dispatch<SetStateAction<PDFFile | undefined>>;
}

export default function Chatbox({ doc, setDoc }: ChatboxParams) {
  const [list, setList] = useState<Message[]>([]);

  // Callback that UserInput will call when a new input is submitted.
  const handleNewInput = (input: string) => {
    const newUserMessage: Message = {
      type: MessageType.USER,
      content: input,
    };
    setList((prevList) => [...prevList, newUserMessage]);
    const newServerMessage: Message = {
      type: MessageType.SERVER,
      content: input,
    };
    setList((prevList) => [...prevList, newServerMessage]);
  };

  return (
    <div className="p-2 flex flex-col h-full w-full gap-2">
      <div className="h-full flex flex-col gap-2 overflow-y-scroll">
        {/* Render the chat logs */}
        {list.map((element, index) => {
          switch (element.type) {
            case MessageType.USER:
              return (
                typeof element.content === "string" && (
                  <Query key={index} message={element.content} />
                )
              );
            case MessageType.SERVER:
              return (
                <Response doc={doc} setDoc={setDoc} key={index} queryString={element.content} />
              );
            default:
              return null;
          }
        })}
      </div>
      <div className="">
        {/* Pass the callback to UserInput */}
        <UserInput onUserSubmit={handleNewInput} />
      </div>
    </div>
  );
}
