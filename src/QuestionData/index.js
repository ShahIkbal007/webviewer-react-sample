import React from "react";
import "./QuestionData.css";

function QuestionData() {
  return (
    <div className="questionContainer">
      <textarea
        id="review"
        name="review"
        className="questionContainer__review"
        placeholder="You can paste here and view your text..."
      ></textarea>
    </div>
  );
}

export default QuestionData;
