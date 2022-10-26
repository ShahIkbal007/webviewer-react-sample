import React, { useRef, useEffect, useState } from "react";
import WebViewer from "@pdftron/webviewer";
import "./App.css";
import axios from "axios";
import { getInstance } from "@pdftron/webviewer";

const dummyFileName = [
  {
    id: 1,
    label: "newFile.pdf",
    status: "ongoing",
  },
  {
    id: 2,
    label: "newFile1.pdf",
    status: "pending",
  },
  {
    id: 3,
    label: "newFile2.pdf",
    status: "completed",
  },
];

const App = () => {
  const viewer = useRef(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("/files/PDFTRON_about.pdf");

  const handleFileSelect = (file) => {
    setSelectedFile(file);
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


        // document.getElementById('select').onchange = e => {
        //   instance.UI.loadDocument(e.target.value);
        // };

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

  useEffect(() => {
    // After WebViewer has already been constructed
    const instance = getInstance([viewer]);
    console.log(instance, "instance-----");
  }, [viewer]);

  const getColor = (status) => {
    if (status === "pending") {
      return "lightgrey";
    }
    if (status === "ongoing") {
      return "#16ad5b";
    }
    if (status === "completed") {
      return "#fb3836";
    }
  };

  useEffect(() => {
    const getFiles = () =>
      axios
        .get("http://localhost:8080/fetch-files")
        .then((res) => {
          console.log(res.data.data.tasks[0].questions, "dataaaa");
          setFiles(res.data.data.tasks[0].questions);
        })
        .catch((err) => console.log(err));
    getFiles();
  }, []);

  return (
    <div className="App">
      <div className="header">
        <span>Order No. 12345</span>{" "}
        <span className="getNewOrderButton">Get New Order</span>
      </div>
      <div className="fileContainer">
        {files.map((file) => (
          <span
            className="file"
            key={file._id}
            onClick={() => handleFileSelect(file)}
            style={{
              background: getColor("pending"),
              border: `1px solid ${getColor("pending")}`,
            }}
          >
            {file.fileName}
          </span>
        ))}
      </div>
      <div className="container">
        <div className="webviewer" ref={viewer}></div>
        <div className="questionContainer">Question Data</div>
      </div>
      <div className="actionContainer">
        <button className="actionButton">Copy Selected Area as Image</button>
        <button className="actionButton">View/Output</button>
        <button className="actionButton">Mark File as Complete</button>
      </div>
    </div>
  );
};

export default App;
