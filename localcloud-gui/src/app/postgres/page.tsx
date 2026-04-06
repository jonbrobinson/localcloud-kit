"use client";

import {
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import DocPageNav from "@/components/DocPageNav";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import { usePreferences } from "@/context/PreferencesContext";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PGADMIN_TRAEFIK_URL = "https://pgadmin.localcloudkit.com:3030";
const PGADMIN_DIRECT_URL = "http://localhost:5050";

// Maps from PreferredLanguage to Postgres tab keys
const LANG_TO_TAB: Record<string, "nodejs" | "python" | "go" | "java"> = {
  typescript: "nodejs",
  node: "nodejs",
  python: "python",
  go: "go",
  java: "java",
  cli: "nodejs",
};

const frameworkExamples = {
  nodejs: `// npm install pg
const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "localcloud",
  user: "localcloud",
  password: "localcloud",
});

async function query() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT NOW() AS now");
    console.log("Connected:", result.rows[0].now);
  } finally {
    client.release();
  }
}

query();`,
  python: `# pip install psycopg2-binary
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="localcloud",
    user="localcloud",
    password="localcloud",
)

cur = conn.cursor()
cur.execute("SELECT NOW()")
print("Connected:", cur.fetchone()[0])

cur.close()
conn.close()`,
  go: `// go get github.com/lib/pq
package main

import (
    "database/sql"
    "fmt"
    "log"

    _ "github.com/lib/pq"
)

func main() {
    dsn := "host=localhost port=5432 user=localcloud password=localcloud dbname=localcloud sslmode=disable"
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    var now string
    db.QueryRow("SELECT NOW()").Scan(&now)
    fmt.Println("Connected:", now)
}`,
  java: `// pom.xml: add postgresql + jdbc dependency
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class Main {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/localcloud";
        Connection conn = DriverManager.getConnection(url, "localcloud", "localcloud");

        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT NOW()");
        if (rs.next()) {
            System.out.println("Connected: " + rs.getString(1));
        }
        conn.close();
    }
}`,
};

const resources = [
  {
    name: "pgAdmin (via Traefik)",
    url: PGADMIN_TRAEFIK_URL,
    description: "Access the pgAdmin web UI through the Traefik reverse proxy.",
  },
  {
    name: "pgAdmin (direct access)",
    url: PGADMIN_DIRECT_URL,
    description: "Direct access to pgAdmin on localhost port 5050.",
  },
  {
    name: "PostgreSQL Documentation",
    url: "https://www.postgresql.org/docs/16/",
    description: "Official PostgreSQL 16 documentation.",
  },
  {
    name: "pgAdmin Documentation",
    url: "https://www.pgadmin.org/docs/",
    description: "Official pgAdmin documentation — features and configuration reference.",
  },
];

export default function PostgresPage() {
  const { profile } = usePreferences();
  const [activeTab, setActiveTab] = useState<"nodejs" | "python" | "go" | "java">("nodejs");

  useEffect(() => {
    if (profile?.preferred_language) {
      const mapped = LANG_TO_TAB[profile.preferred_language];
      if (mapped) setActiveTab(mapped);
    }
  }, [profile?.preferred_language]);

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <DocPageNav title="LocalCloud Kit" subtitle="PostgreSQL">
        <ServiceStatusBadge service="postgres" name="PostgreSQL" />
        <a
          href={PGADMIN_DIRECT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1.5" />
          Open pgAdmin
        </a>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About PostgreSQL</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit includes <strong>PostgreSQL 16</strong> — a powerful, open-source relational database
            that maps to <strong>AWS RDS / Aurora</strong> in production. Use it for structured data, complex queries,
            foreign keys, and full SQL support. <strong>pgAdmin</strong> provides a browser-based GUI to browse
            schemas, run queries, and manage tables without any CLI required.
          </p>
        </section>

        {/* Connection Settings */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Settings</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Setting</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Host machine</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Docker network</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  { label: "Host", host: "localhost", docker: "postgres" },
                  { label: "Port", host: "5432", docker: "5432" },
                  { label: "Database", host: "localcloud", docker: "localcloud" },
                  { label: "Username", host: "localcloud", docker: "localcloud" },
                  { label: "Password", host: "localcloud", docker: "localcloud" },
                  { label: "SSL", host: "Disabled", docker: "Disabled" },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="px-4 py-2.5 text-gray-600">{row.label}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-900">{row.host}</td>
                    <td className="px-4 py-2.5 font-mono text-gray-900">{row.docker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* pgAdmin Access */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">pgAdmin Access</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Setting</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Web UI (direct)</td>
                  <td className="px-4 py-2.5">
                    <a href={PGADMIN_DIRECT_URL} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline text-xs">{PGADMIN_DIRECT_URL}</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Web UI (via Traefik)</td>
                  <td className="px-4 py-2.5">
                    <a href={PGADMIN_TRAEFIK_URL} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:underline text-xs">{PGADMIN_TRAEFIK_URL}</a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Login Email</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">admin@localcloud.dev</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Login Password</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">localcloud</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            After opening pgAdmin, register the PostgreSQL server using the connection settings above (use <code className="bg-gray-100 px-1 rounded">postgres</code> as the host when connecting from within Docker).
          </p>
        </section>

        {/* Framework Integration */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">SDK / Driver Integration</h2>
          <p className="text-sm text-gray-500 mb-4">
            Connect to PostgreSQL from your application using the local credentials above.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {([
              { key: "nodejs", label: "Node.js" },
              { key: "python", label: "Python" },
              { key: "go", label: "Go" },
              { key: "java", label: "Java" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <ThemeableCodeBlock
            code={frameworkExamples[activeTab]}
            language={activeTab === "nodejs" ? "node" : activeTab}
          />
        </section>

        {/* Resources */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resources</h2>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Link</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {resources.map((r, idx) => (
                  <tr key={`${r.name}-${r.url}-${idx}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline font-medium"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        {r.name}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
