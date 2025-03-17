"use client"

import { useRef, useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function DocumentViewer() {
  const containerRef = useRef(null); // Reference for the parent container
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Update container width and height when the window resizes
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      setContainerHeight(containerRef.current.offsetHeight);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContainerHeight(containerRef.current.offsetHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate the smaller of width or height for the PDF width
  const pdfWidth = Math.min(containerWidth, containerHeight);

  return (
    <div ref={containerRef} className="h-full border-2 rounded-md">
      <Document file="http://localhost:3000/test.pdf" className="h-full">
        <Page pageNumber={1} height={pdfWidth} className="h-full" />
      </Document>
    </div>
  );
}
