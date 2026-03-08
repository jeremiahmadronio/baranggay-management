import React, { Fragment, createContext, useContext } from "react";
import { SAMPLE_DATA } from "../../clearance-api/template-api";

// Context for custom preview data
interface PreviewContextType {
  customData: Record<string, string>;
}

export const PreviewContext = createContext<PreviewContextType>({ customData: {} });

export const usePreviewData = () => {
  const context = useContext(PreviewContext);
  return context.customData;
};

// Provider component for wrapping CertificatePreview with custom data
export const PreviewDataProvider: React.FC<{
  data: Record<string, string>;
  children: React.ReactNode;
}> = ({ data, children }) => {
  return (
    <PreviewContext.Provider value={{ customData: data }}>
      {children}
    </PreviewContext.Provider>
  );
};

// ============================================
// SHARED UTILITY FUNCTIONS
// ============================================

/**
 * Get field value with info about data source
 * Returns the value from customData if available, otherwise from SAMPLE_DATA
 */
export const getFieldValue = (
  key: string,
  customData?: Record<string, string>
): { value: string; isCustom: boolean } => {
  if (customData && customData[key]) {
    return { value: customData[key], isCustom: true };
  }
  return { value: SAMPLE_DATA[key] || "___________", isCustom: false };
};

/**
 * Component to render a data field value with proper styling
 * Green for user-entered data, Blue for sample/placeholder data
 */
export const DataValue: React.FC<{
  fieldKey: string;
  customData?: Record<string, string>;
  className?: string;
}> = ({ fieldKey, customData, className = "" }) => {
  const { value, isCustom } = getFieldValue(fieldKey, customData);
  return (
    <span className={`font-bold ${isCustom ? "text-green-700" : "text-blue-700"} ${className}`}>
      {value}
    </span>
  );
};

export const renderTextWithVariables = (
  text: string,
  customData?: Record<string, string>
) => {
  const mergedData = { ...SAMPLE_DATA, ...customData };
  const lines = text.split("\n");
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(\{\{[^}]+\}\})/g);
    const renderedParts = parts.map((part, index) => {
      const match = part.match(/\{\{([^}]+)\}\}/);
      if (match) {
        const variableName = match[1];
        const value = mergedData[variableName] || variableName;
        const isCustomValue = customData && customData[variableName];
        return (
          <span
            key={index}
            className={`font-semibold ${isCustomValue ? "text-green-700" : "text-blue-700"}`}
            title={`Variable: ${variableName}${isCustomValue ? " (from form)" : " (sample)"}`}
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
