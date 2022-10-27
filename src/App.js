import React, { useRef, useEffect, useState } from "react";
import WebViewer from "@pdftron/webviewer";
import "./App.css";
import FileBox from "./FileBox";
import QuestionData from "./QuestionData";
import axios from "axios";

const App = () => {
  const viewer = useRef(null);
  const [instanceState, setInstanceState] = useState(null);
  const [completeOrderID, setCompleteOrderId] = useState(null);
  const [OCROutputData, setOCROutputData] = useState("");

  const handleSelectInstanceFile = (file) => {
    instanceState.UI.loadDocument(file);
  };

  const handleCompletedOrderId = (id) => {
    console.log(id, "idddddddddddd");
    setCompleteOrderId(id);
  };

  const viewOCROutput = (text) => {
    setOCROutputData(text);
  };

  function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  const handleCompleteOrder = () => {
    axios
      .put("http://localhost:8080/fetch-files/complete/" + completeOrderID)
      .then((res) => {
        console.log(res);
      })
      .catch((err) => console.log(err));
  };
  console.log(completeOrderID, "completeOrder");

  const OCROutput = (file) => {
    axios
      .post("http://localhost:8080/output/text/", file, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        console.log(res.data.data, "textttt");
        setOCROutputData(res.data.data);
      })
      .catch((err) => console.log(err));
  };

  console.log(OCROutputData, "OCROutputData");
  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: "/webviewer/lib",
        initialDoc:
          "https://mediatb.blob.core.windows.net/media/632ac8cba772337803404f86/questions/1.pdf",
      },
      viewer.current
    )
      .then((instance) => {
        const {
          documentViewer,
          annotationManager,
          Annotations,
          Tools,
          iframeWindow,
        } = instance.Core;

        setInstanceState(instance);

        // Snipping tool ------>
        const createSnipTool = function() {
          const SnipTool = function() {
            Tools.RectangleCreateTool.apply(this, arguments);
            this.defaults.StrokeColor = new Annotations.Color("#F69A00");
            this.defaults.StrokeThickness = 2;
          };

          SnipTool.prototype = new Tools.RectangleCreateTool();

          return new SnipTool(documentViewer);
        };

        const customSnipTool = createSnipTool();

        instance.registerTool({
          toolName: "SnipTool",
          toolObject: customSnipTool,
          buttonImage: "/assets/snip.png",
          buttonName: "snipToolButton",
          tooltip: "Snipping Tool",
        });

        instance.setHeaderItems((header) => {
          header.push({
            type: "toolButton",
            toolName: "SnipTool",
          });
        });

        const downloadURI = (uri, name) => {
          const link = document.createElement("a");
          link.download = name;
          link.href = uri;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        customSnipTool.on("annotationAdded", (annotation) => {
          console.log("kkkkk");
          const pageIndex = annotation.PageNumber;
          // get the canvas for the page
          const pageContainer = iframeWindow.document.getElementById(
            "pageContainer" + pageIndex
          );
          const pageCanvas = pageContainer.querySelector(".canvas" + pageIndex);

          const topOffset = parseFloat(pageCanvas.style.top) || 0;
          const leftOffset = parseFloat(pageCanvas.style.left) || 0;
          const zoom = documentViewer.getZoom();

          const x = annotation.X * zoom - leftOffset;
          const y = annotation.Y * zoom - topOffset;
          const width = annotation.Width * zoom;
          const height = annotation.Height * zoom;

          const copyCanvas = document.createElement("canvas");
          copyCanvas.width = width;
          copyCanvas.height = height;
          const ctx = copyCanvas.getContext("2d");
          // copy the image data from the page to a new canvas so we can get the data URL
          ctx.drawImage(pageCanvas, x, y, width, height, 0, 0, width, height);
          downloadURI(copyCanvas.toDataURL(), "snippet.png");

          annotationManager.deleteAnnotation(annotation);
        });

        // ------>

        // remove left panel and left panel button from the DOM
        instance.UI.disableElements(["toolbarGroup-Shapes"]);
        instance.UI.disableElements(["toolbarGroup-Annotate"]);
        instance.UI.disableElements(["toolbarGroup-Shapes"]);
        instance.UI.disableElements(["toolbarGroup-Insert"]);
        instance.UI.disableElements(["toolbarGroup-Forms"]);
        instance.UI.disableElements(["toolbarGroup-FillAndSign"]);

        const tool = documentViewer.getTool(Tools.ToolNames.TEXT_SELECT);
        tool.addEventListener("selectionComplete", (startQuad, allQuads) => {
          let selectedText = "";
          Object.keys(allQuads).forEach((pageNum) => {
            const text = documentViewer.getSelectedText(pageNum);
            selectedText += text;
          });
          // the startQuad and allQuads will have the X and Y values you want
          console.log(allQuads, "allQuads");
          console.log(selectedText, "selectedText");
        });

        documentViewer.addEventListener(
          "textSelected",
          (quads, selectedText, pageNumber) => {
            // quads will be an array of 'Quad' objects
            // text is the selected text as a string
            console.log("did it select??");
            if (selectedText.length > 0) {
              console.log(selectedText);
            }
          }
        );

        documentViewer.addEventListener("documentLoaded", () => {
          const rectangleAnnot = new Annotations.RectangleAnnotation({
            PageNumber: 1,
            // values are in page coordinates with (0, 0) in the top left
            X: 100,
            Y: 150,
            Width: 200,
            Height: 50,
            Author: annotationManager.getCurrentUser(),
          });

          // instance.UI.loadDocument(
          //   "https://mediatb.blob.core.windows.net/media/632ac8cba772337803404f86/questions/Assignment_VS_Guidelines.pdf"
          // );
          annotationManager.addAnnotation(rectangleAnnot);
          // need to draw the annotation otherwise it won't show up until the page is refreshed
          annotationManager.redrawAnnotation(rectangleAnnot);

          // this example is using the 'Crop' tool, you can use other tools if you want
          instance.setToolMode("CropPage");

          // when a new crop area is adeded
          annotationManager.on("annotationChanged", async function(
            annotationData,
            action,
            { imported }
          ) {
            if (
              action === "add" &&
              annotationData[0] &&
              annotationData[0].ToolName === "CropPage"
            ) {
              // get the positions of the crop that was added to extract information from
              const cropRect = annotationData[0].getRect();

              documentViewer.getDocument().loadCanvasAsync({
                pageNumber: annotationData[0].PageNumber,
                renderRect: cropRect,
                drawComplete: async (canvas, index) => {
                  // The 'canvas' would be the cropped area of the page.
                  // You can use 'toBlob' or 'toDataURl' extra the data from the canvas
                  // canvas.toBlob((blob) => {
                  //   console.log(blob);
                  // });
                  // const dataFile = btoa(canvas);
                  let datawala = canvas.toDataURL();
                  let sendFile = dataURLtoFile(datawala, "xyz.jpeg");
                  console.log(sendFile, "sendFile");

                  let formdata = new FormData();
                  formdata.append("file", sendFile);

                  for (const pair of formdata.entries()) {
                    console.log(`${pair[0]}, ${pair[1]}`);
                  }

                  OCROutput(formdata);

                  console.log(canvas.toDataURL(), "canvas.toDataUrl");
                },
              });
            }
          });
        });
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="App">
      <div className="header">
        <span>Order No. 12345</span>{" "}
        <span className="getNewOrderButton">Get New Order</span>
        <span className="getNewOrderButton" onClick={handleCompleteOrder}>
          Mark Order as Complete
        </span>
      </div>
      <FileBox
        handleSelectInstanceFile={handleSelectInstanceFile}
        handleCompletedOrderId={(id) => handleCompletedOrderId(id)}
      />
      <div className="container">
        <div className="webviewer" ref={viewer}></div>
        <QuestionData
          OCROutputData={OCROutputData}
          setOCROutputData={setOCROutputData}
        />
      </div>
      <div className="actionContainer">
        <button className="actionButton">Copy Selected Area as Image</button>
        <button className="actionButton" onClick={viewOCROutput}>
          View OCR Output
        </button>
        <button className="actionButton">Mark File as Complete</button>
      </div>
    </div>
  );
};

export default App;
