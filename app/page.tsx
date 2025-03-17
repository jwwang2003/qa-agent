"use client"

import { useEffect, useState, useRef } from "react";
import Chatbox from "./Components/Chatbox";
import Document from "./Components/Document";

import { PDFFile } from "@/Components/Document";
import { constructURL } from "./Utils/apiClient";
import classNames from "classnames";
import { constructFileUrl } from "./Utils/helpers";

const env = process.env.NODE_ENV;

export default function Home() {
  const [doc, setDoc] = useState<PDFFile | undefined>();
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string>("");

  const parentRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [docHeight, setDocHeight] = useState(0);

  useEffect(() => {
    // A function to update the document div height
    function updateDocHeight() {
      if (!parentRef || !barRef) return;

      if (parentRef.current && barRef.current) {
        const parentHeight = parentRef.current.clientHeight;
        const settingsHeight = barRef.current.clientHeight;
        setDocHeight(parentHeight - settingsHeight);
      }
    }

    // Call the function initially
    updateDocHeight();
    // Also update on window resize to handle dynamic changes
    window.addEventListener('resize', updateDocHeight);
    return () => window.removeEventListener('resize', updateDocHeight);
  }, [doc]);

  useEffect(() => {
    if (env === "development" || env === "test") {
      setDoc(constructFileUrl("test.pdf"));
    }
  }, []);

  // Create a download URL if file is a File, otherwise use the string URL directly.
  useEffect(() => {
    if (typeof doc === 'string') {
      setPdfDownloadUrl(doc);
    } else if (doc instanceof File) {
      const url = URL.createObjectURL(doc);
      setPdfDownloadUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [doc]);

  const handleDocClose = () => {
    setDoc(undefined);
  };

  return (
    <div className="p-4 flex flex-col items-center h-full">
      <div className="flex flex-row w-full h-full">
        <div className={classNames("flex grow border-2", doc ? "rounded-l-lg rounded-tr-lg" : "rounded-lg")}>
          <Chatbox doc={doc} setDoc={setDoc} />
        </div>
        <div className="" ref={parentRef}>
        { doc &&
          <>
            <div className="ml-2 flex flex-row" ref={barRef}>
              <button onClick={handleDocClose} className="mr-auto">关闭</button>
              <a
                href={pdfDownloadUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                <button>下载PDF</button>
              </a>
            </div>
            <div className="pt-2 overflow-hidden" style={{ height: docHeight }}>
              <Document file={doc} />
            </div>
          </>
        }
        </div>
      </div>
    </div>
  );
}
