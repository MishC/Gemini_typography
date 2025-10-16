import React, { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import { Zap } from "lucide-react";
import FontAnalyzerForm from "./components/FontAnalyzerForm";
import ResultDisplay from "./components/ResultDisplay";
import type { FontSuggestion } from "./types";

// --- Constants and Utility Functions (stay in this file as requested) ---
const API_URL = "http://localhost:3000/api/suggest-font";

const MOCK_FONT_SUGGESTION: FontSuggestion = {
  font_name: "Press Start 2P",
  reason:
    "Network connection failed. Showing mock response for debugging. The title suggests a clear, nostalgic 8-bit style.",
};

/** Dynamically load a Google Font by injecting a <link> tag (only if different). */
const loadGoogleFont = (fontName: string): void => {
  if (!fontName) return;

  const existingLink = document.getElementById("google-font-link") as HTMLLinkElement | null;
  // If already loaded same font, skip
  if (existingLink?.dataset.fontName === fontName) return;

  if (existingLink) existingLink.remove();

  const formattedFontName = fontName.replace(/\s/g, "+");
  const fontLink = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;700;900&display=swap`;

  const link = document.createElement("link");
  link.id = "google-font-link";
  link.rel = "stylesheet";
  link.href = fontLink;
  // store which font is loaded to avoid redundant reloads
  link.dataset.fontName = fontName;
  document.head.appendChild(link);
};

// --- Main Application Component ---

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>("");
  const [result, setResult] = useState<FontSuggestion | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Guards to prevent duplicate work
  const inFlightRef = useRef(false);              // blocks re-entrancy during one request
  const lastPromptRef = useRef<string | null>(null); // remember last successfully fetched prompt
  const currentFontRef = useRef<string | null>(null); // remember last applied font

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement> | null, initialPrompt?: string): Promise<void> => {
      if (e) e.preventDefault();

      const currentPrompt = (initialPrompt ?? prompt).trim();
      if (!currentPrompt) {
        setError("Please enter a title to analyze.");
        return;
      }

      // 1) Prevent double-click / double-submit while in flight
      if (inFlightRef.current) return;

      // 2) Skip if requesting the exact same prompt as last successful result
      if (lastPromptRef.current && lastPromptRef.current === currentPrompt) {
        // no-op: already have freshest result for this prompt
        return;
      }

      inFlightRef.current = true;
      setLoading(true);
      setError(null);
      // Optional: nevymazávaj result, nech sa UI neleskne; ak chceš „clear“, tak odkomentuj
      // setResult(null);

      try {
        const maxRetries = 3;
        let response: Response | null = null;

        for (let i = 0; i < maxRetries; i++) {
          try {
            response = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: currentPrompt }),
            });
            if (response.ok) break;
            if (response.status === 404 || response.status >= 500) {
              await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500));
            } else {
              break;
            }
          } catch (fetchErr) {
            if (i === maxRetries - 1) throw fetchErr;
            await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500));
          }
        }

        if (!response || !response.ok) {
          let errData: { details?: string } = {};
          try {
            errData = await response!.json();
          } catch { /* ignore */ }
          throw new Error(errData.details || `HTTP error! status: ${response ? response.status : "Network Error"}`);
        }

        const data: FontSuggestion = await response.json();
        setResult((prev) => {
          // avoid state update if font_name & reason didn't change
          if (prev && prev.font_name === data.font_name && prev.reason === data.reason) return prev;
          return data;
        });

        // Mark this prompt as the latest fetched
        lastPromptRef.current = currentPrompt;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        if (errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
          console.warn("Network Error detected. Falling back to mock response.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          setResult((prev) => {
            if (prev && prev.font_name === MOCK_FONT_SUGGESTION.font_name && prev.reason === MOCK_FONT_SUGGESTION.reason)
              return prev;
            return MOCK_FONT_SUGGESTION;
          });
          setError(
            `[MOCK ACTIVE] API server not found at ${API_URL}. Displaying mock font: ${MOCK_FONT_SUGGESTION.font_name}.`
          );
          lastPromptRef.current = currentPrompt; // treat mock as a result for this prompt
        } else {
          console.error("API Error:", err);
          setError(`Server Error: ${errorMsg}.`);
        }
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [prompt]
  );

  // Load font only when a new (different) font arrives
  useEffect(() => {
    const nextFont = result?.font_name?.trim() || null;
    if (!nextFont) return;
    if (currentFontRef.current === nextFont) return; // same font: do nothing

    loadGoogleFont(nextFont);
    currentFontRef.current = nextFont;
  }, [result]);

  // Fixed width card, centered
  const cardStyle = "bg-white w-[800px] p-8 rounded-xl border-4 border-black shadow-2xl";


  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-800 p-4 font-sans antialiased text-gray-800">
      <div className={cardStyle}>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 tracking-tight flex items-center justify-center">
            <Zap className="w-8 h-8 mr-3 text-yellow-400" />
           Font Analyzer
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Input your title and let the AI typographer suggest the perfect Google Font.
          </p>
        </div>

        {/* Input Form Component */}
        <FontAnalyzerForm
          prompt={prompt}
          setPrompt={setPrompt}
          handleSubmit={handleSubmit}
          loading={loading}
        />

        {/* Results/Status Area */}
        <div className="mt-10 pt-8 border-t-4 border-black/10">
          <ResultDisplay error={error} loading={loading} result={result} prompt={prompt} />
        </div>
      </div>
    </div>
  );
};

export default App;
