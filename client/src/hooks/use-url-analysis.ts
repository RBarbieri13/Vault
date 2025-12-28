import { useState, useCallback } from "react";

export interface AIAnalysisResult {
  name: string;
  type: string;
  categoryId: string;
  summary: string;
  whatItIs: string;
  capabilities: string[];
  bestFor: string[];
  tags: string[];
  status: "active" | "inactive" | "beta" | "deprecated";
  contentType: "tool" | "website" | "video" | "podcast" | "article";
  notes: string;
}

export interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  bodyText: string;
  metaKeywords: string[];
}

export interface AnalysisSuccess {
  success: true;
  data: AIAnalysisResult;
  scraped: ScrapedContent;
}

export interface AnalysisError {
  success: false;
  error: string;
  errorType: string;
}

export type AnalysisResult = AnalysisSuccess | AnalysisError;

export function useUrlAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (url: string): Promise<AnalysisResult | null> => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data: AnalysisResult = await response.json();

      if (!data.success) {
        setError(data.error);
        setResult(data);
        return data;
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      setError(errorMessage);
      const errorResult: AnalysisError = {
        success: false,
        error: errorMessage,
        errorType: "NETWORK_ERROR",
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    analyze,
    isAnalyzing,
    result,
    error,
    reset,
  };
}
