import UserInput from "../UserInput";
import Response from "../Response";

export default function Chatbox() {
  return (
    <div className="p-2 border-2 rounded-md flex flex-col h-full gap-2">
      <div className="h-full flex flex-col-reverse gap-2 ">
        {/* Here are the chat logs */}
        <Response />

      </div>
      <div className="">
        <UserInput />
      </div>
      
    </div>
  )
}