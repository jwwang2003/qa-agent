

export default function Query({ message = "无" }) {
  return (
    <div className="flex flex-row w-full">
      <div className="ml-auto max-w-4xl bg-blue-600 text-white text-sm space-y-4 p-3 shadow-sm rounded-lg flex flex-col gap-2">
        {message}
      </div>
    </div>
  )
}