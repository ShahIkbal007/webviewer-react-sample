import axios from "axios";
import React, { useEffect, useState } from "react";
import "./FileBox.css";

function FileBox({ handleSelectInstanceFile }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState();

  const handleFile = (file) => {
    handleSelectInstanceFile(file.fileUrl);
    setSelectedFile(file._id);
  };

  useEffect(() => {
    const getFiles = () =>
      axios
        .get("http://localhost:8080/fetch-files")
        .then((res) => {
          console.log(res.data.data.tasks[0].questions, "dataaaa");
          setFiles(res.data.data.tasks[0].questions);
          setSelectedFile(res.data.tasks[0].questions[0]._id);
        })
        .catch((err) => console.log(err));
    getFiles();
  }, []);

  console.log(selectedFile, "selectedFile");

  // Color for selected files
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

  return (
    <div className="fileContainer">
      {files.map((file) => (
        <span
          className="file"
          id="file"
          key={file._id}
          onClick={() => handleFile(file)}
          style={{
            border: "1.2px solid #1C84FF",
            background: selectedFile === file._id ? "#1C84FF" : "white",
            color: selectedFile === file._id ? "white" : "#1C84FF",
          }}
        >
          {file.fileName}
        </span>
      ))}
    </div>
  );
}

export default FileBox;
