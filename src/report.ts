export type ScoreKey =
  | "clarity"
  | "trust"
  | "energy"
  | "polish"
  | "memorability"
  | "conversionConfidence";

export type VibeReport = {
  url: string;
  title: string;
  verdict: string;
  audience: {
    label: string;
    confidence: number;
  };
  personality: {
    label: string;
    feelsLike: string;
    risk: string;
  };
  scores: Record<ScoreKey, number>;
  signals: Array<{
    label: string;
    tone: "trust" | "friction" | "delight" | "unclear";
    detail: string;
  }>;
  storyboard: Array<{
    time: string;
    observation: string;
  }>;
  annotations: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    tone: "trust" | "friction" | "delight" | "unclear";
    note: string;
  }>;
  screenshot?: string;
};
