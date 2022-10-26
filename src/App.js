import React, { useRef, useEffect, useState } from "react";
import WebViewer from "@pdftron/webviewer";
import "./App.css";
import FileBox from "./FileBox";
import QuestionData from "./QuestionData";

const App = () => {
  const viewer = useRef(null);
  const [instanceState, setInstanceState] = useState(null);

  const handleSelectInstanceFile = (file) => {
    instanceState.UI.loadDocument(file);
  };

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
        } = instance.Core;

        setInstanceState(instance);

        // remove left panel and left panel button from the DOM
        instance.UI.disableElements(["toolbarGroup-Shapes"]);
        instance.UI.disableElements(["toolbarGroup-Annotate"]);
        instance.UI.disableElements(["toolbarGroup-Shapes"]);
        instance.UI.disableElements(["toolbarGroup-Insert"]);
        instance.UI.disableElements(["toolbarGroup-Forms"]);
        instance.UI.disableElements(["toolbarGroup-FillAndSign"]);

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
                  canvas.toBlob((blob) => {
                    console.log(blob);
                  });

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
        <span className="getNewOrderButton">Mark Order as Complete</span>
      </div>
      <FileBox handleSelectInstanceFile={handleSelectInstanceFile} />
      <div className="container">
        <div className="webviewer" ref={viewer}></div>
        <QuestionData />
      </div>
      <div className="actionContainer">
        <button className="actionButton">Copy Selected Area as Image</button>
        <button className="actionButton">View OCR Output</button>
        <button className="actionButton">Mark File as Complete</button>
      </div>
    </div>
  );
};

export default App;
