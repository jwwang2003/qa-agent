import Image from "next/image";
import Chatbox from "./Components/Chatbox";
import Document from "./Components/Document";

export default function Home() {
  return (
    <div className="p-4 flex flex-col items-center h-full">
      <div className="grid grid-cols-2 gap-2 w-full h-full">
        <Chatbox />
        <Document />
      </div>
      
    </div>
  );
}
