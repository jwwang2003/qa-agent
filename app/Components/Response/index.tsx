import classNames from "classnames";
import { JSX, useEffect, useState } from "react";
import Markdown from 'markdown-to-jsx';

import LoadingPlaceholder from "../Placeholders/Loading";
import { mockGenerateAnswer} from "@/Test/fakeApi";
import { apiRequest } from "@/Utils/apiClient";
import { constructFileUrl, splitNames } from "@/Utils/helpers";
import { ChatboxParams } from "../Chatbox";

export interface GenerateAnswerAPI {
  title_summary: string,
  model_answer: string,
  title_related: string,
  content_related: string
}

function Divider({ content = "" }: { content?: string }) {
  return(
    <div className="relative flex items-center">
      <div className="flex-grow border-t border-gray-400"></div>
      { content && <span className="flex-shrink mx-4 text-gray-400">{content}</span> }
      <div className="flex-grow border-t border-gray-400"></div>
    </div>
  )
}

interface SectionParams {
  emoji: string,
  title: string,
  className: string,
  children: JSX.Element
}

function Section({ emoji, title, className, children }: SectionParams) {
  return (
    <div className="bg-gray-100">
    <div className={classNames("text-lg font-semibold text-blue-600 flex items-center space-x-2", className)}>
      <span>{emoji}</span>
      <span>{title}</span>
    </div>
    { children }
  </div>
  )
}

export default function Response({ queryString = "无", doc, setDoc }: { queryString: string } & ChatboxParams) {
  const [valid, setValid] = useState(false);
  const [data, setData] = useState<GenerateAnswerAPI>();

  useEffect(() => {
    const query = queryString;
    if (process.env.NODE_ENV === "development") {
      mockGenerateAnswer(query)
        .then((answer) => {
          setValid(true);
          setData(answer);
        })
        .catch((error) => {
          // No need to catch error, cuz this is a mock API call
        })
    } else {
      // make real API call
      apiRequest<{answer: GenerateAnswerAPI}>(
        "generate_answer", 
        {
          method: "POST", 
          body: JSON.stringify({
            question: queryString
            })
        })
        .then((data) => {
          setValid(true);
          console.log(data);
          setData(data.answer);
        })
        .catch((error) => {
            console.error("API ERROR!", error);
        })
    }
  }, []);

  if (!valid) {
    return (
      <div className="flex flex-row w-full">
        <div className="mr-auto w-full max-w-xl h-7 bg-gray-100 space-y-4 shadow-sm rounded-lg flex flex-col gap-2 overflow-hidden">
          <LoadingPlaceholder />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-row w-full">
      <div className="mr-auto max-w-4xl bg-gray-100 space-y-4 p-4 shadow-sm rounded-lg flex flex-col gap-2">
        <Section emoji={"📖"} title="摘要内容" className="text-blue-600">
          <div className=" text-gray-800 mt-2 text-base">
            <Markdown>{`${data?.title_summary}`}</Markdown>
          </div>
        </Section>
        <Divider />
        <Section emoji={"🤖"} title="大模型回答" className="text-green-600">
          <div className=" text-gray-800 mt-2 text-base">
            <Markdown>{`${data?.model_answer}`}</Markdown>
          </div>
        </Section>
        <Divider />
        <Section emoji={"📌"} title="标题相关文件" className="text-yellow-500">
          <div className="flex flex-col gap-1">
            {
              data && data.title_related && 
              splitNames(data.title_related).map((element, index) => {
                return <button key={index} onClick={() => {
                  let t = constructFileUrl(element)
                  setDoc(t);
                }}>{element}</button>
              })
            }
          </div>
          {/* <p className=" text-gray-800 mt-2 text-base">
           {data?.title_related}
          </p> */}
        </Section>
        <Divider />
        <Section emoji={"📚"} title="内容相关文件" className="text-purple-600">
          <div className="flex flex-col gap-1">
            {
              data && data.content_related && 
              splitNames(data.content_related).map((element, index) => {
                return <button key={index} onClick={() => {
                  let t = constructFileUrl(element)
                  console.log(t);
                  setDoc(t);
                }}>{element}</button>
              })
            }
          </div>
          {/* <div className="text-gray-800 mt-2 text-base">
            {data?.content_related}
          </div> */}
        </Section>
      </div>
    </div>
      
  )
}