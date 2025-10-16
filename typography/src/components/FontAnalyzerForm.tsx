import React, { type ChangeEvent, type FormEvent } from "react";
import { Loader2, Rocket } from "lucide-react";
import type { FontAnalyzerFormProps } from "../types";

const FontAnalyzerForm: React.FC<FontAnalyzerFormProps> = ({ prompt, setPrompt, handleSubmit, loading }) => {
  const inputStyle =
    "w-full p-4 text-xl text-white border-4 border-black rounded-lg shadow-xl focus:border-yellow-400 focus:outline-none";
  const buttonStyle =
    "w-full flex items-center justify-center space-x-2 py-4 px-6 text-xl font-bold bg-yellow-400 text-black border-4 border-black rounded-lg transition-transform transform hover:scale-[1.01] active:scale-[0.99] shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed";

  const handlePromptChange = (e: ChangeEvent<HTMLInputElement>) => setPrompt(e.target.value);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => handleSubmit(e);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="title-prompt" className="block text-lg font-bold text-gray-700 mb-2">
          Title to Analyze
        </label>
        <input
          id="title-prompt"
          type="text"
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Write your title here..."
          className={inputStyle}
          disabled={loading}
        />
      </div>

      <button type="submit" className={buttonStyle} disabled={loading}>
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Rocket className="w-6 h-6" />}
        <span>{loading ? "Analyzing..." : "Get Font Suggestion"}</span>
      </button>
    </form>
  );
};

export default FontAnalyzerForm;
