import React, { Fragment } from "react";
import { SAMPLE_DATA } from "../../clearance-api/MockApi";
export const renderTextWithVariables = (text: string) => {
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\{\{[^}]+\}\})/g);
    const renderedParts = parts.map((part, index) => {
      const match = part.match(/\{\{([^}]+)\}\}/);
      if (match) {
        const variableName = match[1];
        const value = SAMPLE_DATA[variableName] || variableName;
        return (
          <span
            key={index}
            className="text-blue-700 font-semibold"
            title={`Variable: ${variableName}`}
          >
            {value}
          </span>
        );
      }
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      if (boldParts.length > 1) {
        return boldParts.map((bp, bpIdx) => {
          const boldMatch = bp.match(/\*\*([^*]+)\*\*/);
          if (boldMatch) {
            return <strong key={`${index}-${bpIdx}`}>{boldMatch[1]}</strong>;
          }
          return <span key={`${index}-${bpIdx}`}>{bp}</span>;
        });
      }
      return <span key={index}>{part}</span>;
    });
    return (
      <Fragment key={lineIndex}>
        {renderedParts}
        {lineIndex < lines.length - 1 && <br />}
      </Fragment>
    );
  });
};
