// interface ResponseParams = {

// }

function Divider({ content = "" }: { content?: string }) {
  return(
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-gray-400"></div>
      { content && <span className="flex-shrink mx-4 text-gray-400">{content}</span> }
      <div className="flex-grow border-t border-gray-400"></div>
    </div>
  )
}

// function Section({ emoji, title, content })

export default function Response() {
  return (
      <div className="bg-gray-100 space-y-4 p-2 mx-auto shadow-sm rounded-lg">
        <div className="message system bg-gray-100 p-4">
          <div className="message-header text-lg font-semibold text-blue-600 flex items-center space-x-2">
            <span>📖</span>
            <span>摘要内容</span>
          </div>
          <p className="message-body text-gray-800 mt-2 text-base">
            山西省在2023年出台了关于加强知识产权工作的政策，重点加强了对企业创新和知识产权保护的支持。
          </p>
        </div>

        <Divider />

        <div className="message system bg-gray-100 p-4">
            <div className="message-header text-lg font-semibold text-green-600 flex items-center space-x-2">
                <span>🤖</span>
                <span>大模型回答</span>
            </div>
            <p className="message-body text-gray-800 mt-2 text-base">
                2023年山西省政府发布了一项政策，明确了如何加强知识产权保护，特别是对创新型企业的支持。这一政策预计将对地方经济的创新能力提升产生积极影响。
            </p>
        </div>

        <Divider />

        <div className="message system bg-gray-100 p-4">
            <div className="message-header text-lg font-semibold text-yellow-500 flex items-center space-x-2">
                <span>📌</span>
                <span>标题相关文件</span>
            </div>
            <p className="message-body text-gray-800 mt-2 text-base">
                《山西省知识产权政策解读》
            </p>
        </div>

        <Divider />

        <div className="message system bg-gray-100 p-4">
            <div className="message-header text-lg font-semibold text-purple-600 flex items-center space-x-2">
                <span>📚</span>
                <span>内容相关文件</span>
            </div>
            <p className="message-body text-gray-800 mt-2 text-base">
                《知识产权保护与创新》
            </p>
        </div>
    </div>
  )
}