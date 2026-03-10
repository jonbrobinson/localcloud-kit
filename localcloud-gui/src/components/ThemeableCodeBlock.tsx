"use client";

import { useState, useEffect } from "react";
import hljs from "highlight.js";
import { highlightThemes, HighlightTheme } from "./highlightThemes";
import { usePreferences } from "@/context/PreferencesContext";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

import "highlight.js/lib/languages/javascript";
import "highlight.js/lib/languages/typescript";
import "highlight.js/lib/languages/python";
import "highlight.js/lib/languages/bash";
import "highlight.js/lib/languages/php";

const THEME_LINK_ID = "hljs-theme-docs";

const languageMap: Record<string, string> = {
  typescript: "typescript",
  node: "javascript",
  javascript: "javascript",
  python: "python",
  cli: "bash",
  nodemailer: "javascript",
  sendgrid: "javascript",
  laravel: "php",
  django: "python",
  flask: "python",
};

interface ThemeableCodeBlockProps {
  code: string;
  language: string;
  showThemeSelector?: boolean;
}

export default function ThemeableCodeBlock({
  code,
  language,
  showThemeSelector = true,
}: ThemeableCodeBlockProps) {
  const { profile } = usePreferences();
  const defaultTheme = (profile?.highlight_theme as HighlightTheme) || "github";
  const [selectedTheme, setSelectedTheme] = useState<HighlightTheme>(defaultTheme);

  useEffect(() => {
    if (profile?.highlight_theme && highlightThemes[profile.highlight_theme]) {
      setSelectedTheme(profile.highlight_theme as HighlightTheme);
    }
  }, [profile?.highlight_theme]);

  useEffect(() => {
    const themeFile = highlightThemes[selectedTheme] || highlightThemes.github;
    let link = document.getElementById(THEME_LINK_ID) as HTMLLinkElement | null;
    if (link) {
      link.href = `/hljs-themes/${themeFile}`;
    } else {
      link = document.createElement("link");
      link.id = THEME_LINK_ID;
      link.rel = "stylesheet";
      link.href = `/hljs-themes/${themeFile}`;
      document.head.appendChild(link);
    }
  }, [selectedTheme]);

  const hljsLanguage = languageMap[language.toLowerCase()] || "text";
  const [highlighted, setHighlighted] = useState("");

  useEffect(() => {
    try {
      setHighlighted(hljs.highlight(code, { language: hljsLanguage }).value);
    } catch {
      setHighlighted(hljs.highlightAuto(code).value);
    }
  }, [code, hljsLanguage]);

  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  };

  const isDarkTheme = selectedTheme.includes("dark");

  return (
    <div className="relative group">
      <div className="flex items-center justify-end gap-2 mb-2">
        {showThemeSelector && (
          <>
            <label
              htmlFor="samples-theme-select"
              className="text-xs font-medium text-gray-600"
            >
              Theme:
            </label>
            <select
              id="samples-theme-select"
              value={selectedTheme}
              onChange={(e) =>
                setSelectedTheme(e.target.value as HighlightTheme)
              }
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(highlightThemes).map((key) => (
                <option key={key} value={key}>
                  {key.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          onClick={copy}
          className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          title="Copy"
        >
          <ClipboardDocumentIcon className="h-4 w-4" />
        </button>
      </div>
      <pre
        className={`rounded-lg p-4 overflow-x-auto text-sm whitespace-pre-wrap ${
          isDarkTheme ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        {highlighted ? (
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlighted }}
            style={{ background: "transparent", padding: 0 }}
          />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  );
}
