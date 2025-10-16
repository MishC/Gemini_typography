import React from "react";
import { Loader2, Type } from "lucide-react";
import type { ResultDisplayProps } from "../types";

const ResultDisplay: React.FC<ResultDisplayProps> = ({ error, loading, result, prompt }) => {
  if (error) {
    return (
      <div className="bg-red-100 border-4 border-red-500 text-red-700 p-4 rounded-lg font-mono mb-6 shadow-md">
        <p className="font-bold">Error:</p>
        <p className="text-sm break-words">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500">
        <Loader2 className="w-10 h-10 mx-auto animate-spin" />
        <p className="mt-2 text-xl font-medium">Fetching Typographic Wisdom...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-blue-100 rounded-xl border-4 border-blue-800 shadow-inner">
          <p className="text-sm font-bold text-blue-800 mb-2 uppercase tracking-wider">Suggested Font</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 break-words">{result.font_name}</h2>
          <p className="mt-1 text-md text-gray-700 font-medium">Rationale: *{result.reason}*</p>
        </div>

        <div className="text-center p-8 bg-black/5 rounded-xl border-2 border-black/10 shadow-lg">
          <p className="text-lg font-medium text-gray-700 mb-4 flex items-center justify-center">
            <Type className="w-5 h-5 mr-2" />
            Your Title Preview:
          </p>
          <h3
            className="text-6xl sm:text-8xl font-black transition-all duration-300 ease-in-out break-words"
            style={{ fontFamily: result.font_name || "sans-serif" }}
          >
            {prompt}
          </h3>
        </div>
      </div>
    );
  }

  return null;
};

export default ResultDisplay;
