"use client";

import { useState, useCallback, useEffect } from 'react';
import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

const resizeObserverOptions = {};

export type PDFFile = string | File | null;

interface DocumentViewerProps {
  file: PDFFile;
}

export default function DocumentViewer({ file }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>();
  const [hasError, setHasError] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string>('');

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;
    if (entry) {
      setContainerHeight(entry.contentRect.height);
    }
  }, []);

  useResizeObserver(containerRef, resizeObserverOptions, onResize);

  // Create a download URL if file is a File, otherwise use the string URL directly.
  useEffect(() => {
    if (typeof file === 'string') {
      setPdfDownloadUrl(file);
    } else {
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPdfDownloadUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Do not render anything if file is null, empty string, or otherwise invalid.
  if (!file || (typeof file === 'string' && file.trim() === '')) {
    return null;
  }

  function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  function onDocumentLoadError(error: Error): void {
    console.error('Error while loading document:', error);
    setHasError(true);
  }

  if (hasError) return null;

  return (
    <div className="relative flex h-full border-2 rounded-r-md">
      {/* PDF download option */}
      <div className="flex fixed justify-end p-2">
        <a
          href={pdfDownloadUrl}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Download PDF
        </a>
      </div>
      <div className="h-full" ref={setContainerRef}>
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={options}
          className="h-full overflow-y-scroll"
        >
          {Array.from(new Array(numPages || 0), (_el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              height={containerHeight}
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
