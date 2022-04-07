import React, { useEffect, useRef, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { PDFDocument, StandardFonts, rgb, PageSizes, cleanText } from "pdf-lib";
import { Page } from "react-pdf";
import { Document } from "react-pdf/dist/esm/entry.webpack";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import LoremIpsum from "./Lorem_ipsum.pdf";
import Switch from "react-switch";

function App() {
  const ref = useRef<any>(null);
  const [numPages, setNumPages] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState<any>(1);
  const [pdfData, setPdfData] = useState<any>(null);

  const [marker, setMarker] = useState<boolean>(false);
  const [markerCanvas, setMarkerCanvas] = useState<HTMLCanvasElement | null>(
    null
  );
  const [canvasContext, setCanvasContext] =
    useState<CanvasRenderingContext2D | null>(null);
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);

  let painting = false;

  async function createPdf() {
    // const pdfDoc = await PDFDocument.load(LoremIpsum);
    // console.log(pdfDoc);
    // const pdfDataUri = await pdfDoc.saveAsBase64({ dataUri: true });
    setPdfData(LoremIpsum);
  }

  useEffect(() => {
    createPdf();
  }, []);

  useEffect(() => {}, []);

  useEffect(() => {
    console.log(ref);
  }, [ref]);

  function onDocumentLoadSuccess({ numPages: numberOfPages }: any) {
    console.log("numberOfPages", numberOfPages);
    setNumPages(numberOfPages);

    setTimeout(() => {
      createCanvas();
    }, 1000);
  }

  useEffect(() => {
    if (markerCanvas === null) return;

    markerCanvas.style.pointerEvents = marker ? "auto" : "none";
  }, [markerCanvas, marker]);

  function startPosition(e: any) {
    setIsPainting(true);
    painting = true;
    console.log("startPosition", e);
    updatePosition(e);
  }

  function endPosition() {
    setIsPainting(false);
    painting = false;
    canvasContext?.beginPath();
  }

  function updatePosition(e: MouseEvent) {
    console.log(canvasContext, painting);

    if (!painting || canvasContext == null || markerCanvas === null) return;

    console.log("updatePosition", e);

    const { top, left } = markerCanvas.getBoundingClientRect();

    canvasContext.lineWidth = 5;
    canvasContext.lineCap = "round";
    canvasContext.strokeStyle = "red";
    canvasContext.globalAlpha = 0.1;

    canvasContext.lineTo(e.clientX - left, e.clientY - top);
    canvasContext.stroke();
    canvasContext.moveTo(e.clientX - left, e.clientY - top);
  }

  useEffect(() => {
    if (markerCanvas === null || canvasContext === null) return;

    markerCanvas.addEventListener("mousedown", startPosition);
    markerCanvas.addEventListener("mousemove", updatePosition);
    markerCanvas.addEventListener("mouseup", endPosition);

    return () => {
      markerCanvas.removeEventListener("mousedown", startPosition);
      markerCanvas.removeEventListener("mousemove", updatePosition);
      markerCanvas.removeEventListener("mouseup", endPosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerCanvas, canvasContext]);

  function createCanvas() {
    const annotations_div = document.getElementsByClassName(
      "react-pdf__Page__annotations annotationLayer"
    )[0];
    const page = document.getElementsByClassName("react-pdf__Page__canvas")[0];

    const page_pos = page.getBoundingClientRect();

    const canvas = document.createElement("canvas");

    canvas.width = page_pos.width;
    canvas.height = page_pos.height;
    canvas.style.width = page_pos.width + "px";
    canvas.style.height = page_pos.height + "px";
    canvas.style.position = "absolute";
    canvas.style.top = page_pos.top / 2 + "px";
    canvas.style.left = page_pos.left + "px";
    setMarkerCanvas(canvas);
    setCanvasContext(canvas.getContext("2d"));
    annotations_div.appendChild(canvas);
  }

  function Annotate() {
    const parentNode: Node | null | undefined =
      document.getSelection()?.anchorNode?.parentNode?.parentElement;
    const oRange: Range | undefined = document.getSelection()?.getRangeAt(0);

    const currentElement: HTMLElement | null | undefined =
      document.getSelection()?.anchorNode?.parentNode?.parentElement;

    console.log(currentElement);

    const MainRect: DOMRect | undefined =
      currentElement?.getBoundingClientRect();

    if (MainRect === undefined) return;

    let oRect: DOMRectList | undefined = oRange?.getClientRects();
    if (oRect === undefined) return;

    const len: number = oRect.length === undefined ? 0 : oRect.length;

    for (let i = 0; i < len; i++) {
      const createDiv = document.createElement("div");

      if (i > 0 && oRect[i].y - oRect[i - 1].y < oRect[i].height) continue;

      const top: number = oRect[i]?.top;
      const left: number = oRect[i]?.left;
      let leftpos: number = MainRect.left;
      let toppos: number = MainRect.top;

      if (isNaN(leftpos)) leftpos = 0;
      if (isNaN(toppos)) toppos = 0;

      console.log(top, toppos, left, leftpos);
      console.log({
        top: `${toppos - top}px`,
        left: `${leftpos + left}px`,
      });

      createDiv.style.position = "absolute";
      createDiv.style.top = `${top - toppos - 3}px`;
      createDiv.style.left = `${left - leftpos - 1}px`;
      createDiv.style.width = oRect[i]?.width + 2 + "px";
      createDiv.style.height = oRect[i]?.height + 3 + "px";
      createDiv.style.opacity = "0.3";
      createDiv.style.borderRadius = "3px";
      createDiv.style.backgroundColor = "red";
      createDiv.style.zIndex = "9999";

      parentNode?.appendChild(createDiv);
      console.log(oRect);
    }
  }

  return (
    <div className="App">
      <button
        onClick={() => {
          // console.log(getSelectionText());
          Annotate();
        }}
        className="bg-red-200"
      >
        Annotate
      </button>
      <div className="flex">
        <Switch checked={marker} onChange={() => setMarker(!marker)} />
        Marker
      </div>
      <button
        onClick={() => {
          setScale(2);
        }}
      >
        2x Scale
      </button>
      <div className="">
        <Document
          file={pdfData}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(err) => {
            console.log(err);
          }}
          renderMode="canvas"
        >
          {Array(numPages)
            .fill(0)
            .map((_, i) => (
              <div>
                <Page key={i} pageNumber={i + 1} scale={scale} />
              </div>
            ))}
        </Document>
      </div>
      <div>
        <p>
          Page {pageNumber} of {numPages}
        </p>
        <button
          onClick={() => {
            setPageNumber(pageNumber + 1);
          }}
        >
          Next Page
        </button>
        <button
          onClick={() => {
            setPageNumber(pageNumber - 1);
          }}
        >
          Previous Page
        </button>
      </div>
    </div>
  );
}

export default App;
