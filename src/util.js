import axios from "axios";
export const getFiles = axios
  .get("http://localhost:8080/fetch-files/155014")
  .then((res) => res.data)
  .catch((err) => console.log(err));

export const changeStatus = axios
  .post("/changeStatus")
  .then((res) => res.data)
  .catch((err) => console.log(err));
