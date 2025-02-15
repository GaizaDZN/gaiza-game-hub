import React from "react";

const tickerText = [
  "Breaking: Neon tides sweep through virtual Pacific Gridspace.",
  "Update: Quantum cats detected simultaneously in 12 parallel timelines.",
  "Alert: Lunar City Alpha unveils the first solar-ink skyscraper.",
  "Breaking: Synthwave storms expected near the Chromatic Rift tonight.",
  "Report: Holographic DJs set to perform at the Interstellar Harmony Expo.",
  "Exclusive: AI-led expedition uncovers forgotten databanks on Mars.",
  "Weather: Vapor rains forecast in the Tokyo Cloud District.",
  "Headline: Cryo-mining yields record plasma gem hauls from Europa.",
];

const TickerSpan: React.FC<{ content: string }> = ({ content }) => {
  return <span>{content}</span>;
};

// Symbol component to render between spans
const TickerSymbol: React.FC = () => {
  return <span className="ticker-symbol"> • </span>; // Use any symbol or icon here
};

const Ticker: React.FC = () => {
  // duplicated text to avoid
  const duplicatedTickerText = [...tickerText, ...tickerText];

  return (
    <div className="ticker-container">
      <div className="ticker">
        {duplicatedTickerText.map((content, index) => (
          <React.Fragment key={index}>
            <TickerSpan content={content} />
            {index !== duplicatedTickerText.length - 1 && <TickerSymbol />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Ticker;
