import React from "react";
import "./QuestionData.css";

function QuestionData({ OCROutputData, setOCROutputData }) {
  return (
    <div className="questionContainer">
      <textarea
        id="review"
        name="review"
        className="questionContainer__review"
        placeholder="You can paste here and view your text..."
        value={OCROutputData}
        onChange={(e) => setOCROutputData(e.target.value)}
      ></textarea>
    </div>
  );
}

export default QuestionData;
