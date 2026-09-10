"use client";

import { useState, useEffect } from "react";
import hljs from "highlight.js";
import { highlightThemes, HighlightTheme } from "./highlightThemes";
import { usePreferences } from "@/context/PreferencesContext";
import type { HighlightTheme as ProfileHighlightTheme } from "@/types";
import { toast } from "react-hot-toast";
import { IconButton } from "./ui";

import "highlight.js/lib/languages/javascript";
import "highlight.js/lib/languages/typescript";
import "highlight.js/lib/languages/python";
import "highlight.js/lib/languages/bash";
import "highlight.js/lib/languages/php";
import "highlight.js/lib/languages/go";
import "highlight.js/lib/languages/java";

const THEME_LINK_ID = "hljs-theme-docs";

const languageMap: Record<string, string> = {
  typescript: "typescript",
  node: "javascript",
  javascript: "javascript",
  python: "python",
  cli: "bash",
  bash: "bash",
  shell: "bash",
  nodemailer: "javascript",
  sendgrid: "javascript",
  laravel: "php",
  django: "python",
  flask: "python",
  go: "go",
  java: "java",
};

interface ThemeableCodeBlockProps {
  code: string;
  language: string;
  showThemeSelector?: boolean;
  showCopyButton?: boolean;
}

export default function ThemeableCodeBlock({
  code,
  language,
  showThemeSelector = true,
  showCopyButton = true,
}: ThemeableCodeBlockProps) {
  const { profile, updateProfile } = usePreferences();
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
      {(showThemeSelector || showCopyButton) && (
      <div className="flex items-center justify-end gap-2 mb-2">
        {showThemeSelector && (
          <>
            <label
              htmlFor="samples-theme-select"
              className="text-xs font-medium text-muted"
            >
              Theme:
            </label>
            <select
              id="samples-theme-select"
              value={selectedTheme}
              onChange={(e) => {
                const theme = e.target.value as HighlightTheme;
                setSelectedTheme(theme);
                updateProfile({ highlight_theme: theme as ProfileHighlightTheme }).catch(() => {});
              }}
              className="text-xs border border-border-strong rounded-md px-2 py-1 bg-surface text-ink outline-none focus:border-primary focus:ring-3 focus:ring-focus"
            >
              {Object.keys(highlightThemes).map((key) => (
                <option key={key} value={key}>
                  {key.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </>
        )}
        {showCopyButton && (
          <IconButton icon="lucide:copy" variant="outline" size="sm" label="Copy" onClick={copy} />
        )}
      </div>
      )}
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
