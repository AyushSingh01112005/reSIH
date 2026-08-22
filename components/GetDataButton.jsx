"use client";

import axios from "axios";

const GetDataButton = () => {
  const getData = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/get-data");

      console.log("Data:", response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <button
      onClick={getData}
      className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
    >
      Get Data
    </button>
  );
};

export default GetDataButton;