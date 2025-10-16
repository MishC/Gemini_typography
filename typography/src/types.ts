// Interfaces for TypeScript

/** Defines the structure of the data expected from the font suggestion API. */
export interface FontSuggestion {
  font_name: string;
  reason: string;
}

/** Props for the input form component. */
export interface FontAnalyzerFormProps {
  prompt: string;
  setPrompt: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement> | null, initialPrompt?: string) => Promise<void>;
  loading: boolean;
}

/** Props for the result display component. */
export interface ResultDisplayProps {
  error: string | null;
  loading: boolean;
  result: FontSuggestion | null;
  prompt: string;
}
/** Props for the main application component. */