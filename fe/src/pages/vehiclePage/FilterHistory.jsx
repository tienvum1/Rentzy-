import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import VehicleCard from "../../components/vehicleCard/VehicleCard";

const FilterHistory = () => {
  const [filterHistories, setFilterHistories] = useState([]);
  const [newFilter, setNewFilter] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [aiSuggestion, setAiSuggestion] = useState("");

  useEffect(() => {
    fetchFilterHistory();
  }, []);

  const fetchFilterHistory = async () => {
    try {
      const res = await axios.get("/api/vehicles/filter/history");
      setFilterHistories(res.data.data); // Assume data is array of { _id, text }
    } catch (error) {
      console.error("Failed to fetch filter history", error);
    }
  };

  const deleteHistory = async (id) => {
    try {
      await axios.delete(`/api/vehicles/filter/history/${id}`, {
        withCredentials: true,
      });
      setFilterHistories((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Failed to delete filter", error);
    }
  };

  const addFilter = async () => {
    if (!newFilter.trim()) return;
    // check if filter contains rude words :
    const response = await axios.get(
      `/api/chat/checkRudeWords?text=${newFilter}`
    );
    if (response.data.isRude) {
      toast.error(`Rude words detected: ${response.data.reason}`);
      return;
    }

    try {
      const res = await axios.post("/api/vehicles/filter/history", {
        text: newFilter,
      });
      const newItem = res.data.data; // assuming it returns { _id, text }
      setFilterHistories((prev) => [
        newItem,
        ...prev.filter((item) => item.text !== newFilter),
      ]);
      setNewFilter("");
    } catch (error) {
      console.error("Failed to add filter", error);
    }
  };

  // find car base of filter history :
  const findCarBaseOnHistory = async () => {
    try {
      const response = await axios.post(
        "api/chat/suggestedCar-base-on-filter-history",
        {
          filterHistories,
        }
      );
      // if have suggest list :
      if (Array.isArray(response.data)) {
        setAiSuggestion(response.data);
      }
    } catch (error) {
      console.log("error when findCarBaseOnHistory");
    }
  };

  // Microphone & Speech Recognition logic
  const handleMicClick = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewFilter(transcript);
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <>
      <div className="relative bg-gradient-to-br from-purple-100 via-indigo-100 to-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-xl mx-auto mt-8 border border-purple-200">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-purple-300 opacity-30 rounded-full blur-2xl -z-10"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-300 opacity-30 rounded-full blur-2xl -z-10"></div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-purple-700 mb-6 text-center drop-shadow-lg">
          Filter History
        </h2>

        <ul className="space-y-3 mb-6">
          {filterHistories.length === 0 && (
            <li className="text-center text-gray-400 italic">No filter history yet.</li>
          )}
          {filterHistories.map((item) => (
            <li
              key={item._id}
              className="flex justify-between items-center bg-white/80 px-4 py-2 rounded-xl shadow hover:shadow-lg transition-all duration-200 border border-purple-100"
            >
              <span className="font-medium text-indigo-700">{item.text}</span>
              <button
                onClick={() => deleteHistory(item._id)}
                className="text-red-500 hover:text-red-700 font-bold text-lg transition"
                title="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newFilter}
            onChange={(e) => setNewFilter(e.target.value)}
            placeholder="Add new filter text"
            className="flex-1 px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none bg-white shadow"
          />
          <button
            onClick={addFilter}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-semibold shadow hover:scale-105 transition"
          >
            Add
          </button>
          <button
            type="button"
            onClick={handleMicClick}
            className={`px-3 py-2 rounded-xl border-2 shadow transition ${
              listening
                ? "bg-red-100 border-red-400 animate-pulse"
                : "bg-gray-100 border-gray-300 hover:bg-purple-100 hover:border-purple-400"
            }`}
            title="Speak to add filter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${
                listening ? "text-red-500" : "text-purple-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18v3m6-3a6 6 0 01-12 0m6-13a3 3 0 013 3v6a3 3 0 01-6 0V8a3 3 0 013-3z"
              />
            </svg>
          </button>
        </div>

        <button
          onClick={() => findCarBaseOnHistory()}
          className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-3 rounded-xl font-bold shadow hover:scale-105 transition mb-2"
        >
          Find Car Based on History
        </button>
      </div>
      {/* // render vehicle list : */}
      {aiSuggestion && (
        <div className="vehicle-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 px-2">
          {aiSuggestion
            .filter(
              (v) => v.status === "available" && v.approvalStatus === "approved"
            )
            .map((v) => (
              <VehicleCard key={v._id} vehicle={v} />
            ))}
        </div>
      )}
    </>
  );
};

export default FilterHistory;