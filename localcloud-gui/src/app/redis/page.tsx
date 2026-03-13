"use client";

import RedisModal from "@/components/RedisModal";
import {
  ArrowTopRightOnSquareIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import DocPageNav from "@/components/DocPageNav";
import { usePreferences } from "@/context/PreferencesContext";
import { useEffect, useState } from "react";
import ThemeableCodeBlock from "@/components/ThemeableCodeBlock";
import ServiceStatusBadge from "@/components/ServiceStatusBadge";

const PAGE_TABS = ["typescript", "node", "python", "cli"] as const;
type PageTab = (typeof PAGE_TABS)[number];

const clientExamples = {
  typescript: `// npm install ioredis
import Redis from "ioredis";

const redis = new Redis({
  host: "localhost",
  port: 6380,
});

// Set a key
await redis.set("greeting", "hello world");
await redis.set("counter", "42", "EX", 3600); // expires in 1 hour

// Get a key
const value: string | null = await redis.get("greeting");
console.log(value); // "hello world"

// Delete a key
await redis.del("greeting");

redis.quit();`,
  node: `// npm install ioredis
const Redis = require("ioredis");

const redis = new Redis({
  host: "localhost",
  port: 6380,
});

// Set a key
await redis.set("greeting", "hello world");
await redis.set("counter", 42, "EX", 3600); // expires in 1 hour

// Get a key
const value = await redis.get("greeting");
console.log(value); // "hello world"

// Delete a key
await redis.del("greeting");

redis.quit();`,
  python: `# pip install redis
import redis

client = redis.Redis(host="localhost", port=6380, decode_responses=True)

# Set a key
client.set("greeting", "hello world")
client.setex("counter", 3600, 42)  # expires in 1 hour

# Get a key
value = client.get("greeting")
print(value)  # "hello world"

# Delete a key
client.delete("greeting")

client.close()`,
  cli: `# Connect to Redis via CLI
redis-cli -h localhost -p 6380

# Basic commands
SET greeting "hello world"
GET greeting
DEL greeting

# With expiry
SET session:abc123 "user_data" EX 3600

# List all keys
KEYS *

# Flush the database (dev only)
FLUSHALL`,
};

const externalResources = [
  {
    name: "Redis Documentation",
    url: "https://redis.io/docs/",
    description: "Official Redis documentation — commands, data types, and configuration.",
  },
  {
    name: "ioredis (Node.js)",
    url: "https://github.com/redis/ioredis",
    description: "Robust, full-featured Redis client for Node.js with promise support.",
  },
  {
    name: "redis-py (Python)",
    url: "https://redis-py.readthedocs.io/",
    description: "The official Python interface to the Redis key-value store.",
  },
  {
    name: "Redis CLI Reference",
    url: "https://redis.io/docs/manual/cli/",
    description: "Complete redis-cli usage guide with examples.",
  },
];

export default function RedisDocPage() {
  const [showModal, setShowModal] = useState(false);
  const { profile, updateProfile } = usePreferences();
  const [activeTab, setActiveTab] = useState<PageTab>("typescript");

  useEffect(() => {
    if (profile?.preferred_language) {
      const lang = profile.preferred_language as PageTab;
      setActiveTab(PAGE_TABS.includes(lang) ? lang : "typescript");
    }
  }, [profile?.preferred_language]);

  const handleTabChange = (tab: PageTab) => {
    setActiveTab(tab);
    updateProfile({ preferred_language: tab }).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DocPageNav title="LocalCloud Kit" subtitle="In-memory Redis caching service">
        <ServiceStatusBadge service="redis" name="Redis" />
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ServerIcon className="h-4 w-4 mr-1.5" />
          Manage Cache
        </button>
      </DocPageNav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Redis</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            LocalCloud Kit includes <strong>Redis 7</strong> — a fast, in-memory data structure store
            used as a cache, session store, and message broker. It runs alongside LocalStack so your
            application can use caching locally without any external infrastructure.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-2">
            The <strong>Cache</strong> card on your dashboard reflects the live Redis state.
            Click <em>Open</em> on that card to browse keys, check memory usage, and run commands.
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
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Host</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">localhost</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">localcloud-redis</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Port</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">6380</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900">6379</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">Password</td>
                  <td className="px-4 py-2.5 font-mono text-gray-400 italic" colSpan={2}>none required</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-600">TLS</td>
                  <td className="px-4 py-2.5 font-mono text-gray-900" colSpan={2}>Off</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Client Examples */}
        <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Client Examples</h2>
          <p className="text-sm text-gray-500 mb-4">
            Connect to Redis from your application using any Redis-compatible client.
          </p>
          <div className="flex space-x-1 mb-4 border-b border-gray-200">
            {([
              { key: "typescript" as const, label: "TypeScript" },
              { key: "node" as const, label: "Node.js" },
              { key: "python" as const, label: "Python" },
              { key: "cli" as const, label: "Redis CLI" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
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
          {activeTab === "typescript" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                TypeScript — <code className="bg-gray-100 px-1 rounded">npm install ioredis</code>
              </p>
              <ThemeableCodeBlock code={clientExamples.typescript} language="typescript" />
            </div>
          )}
          {activeTab === "node" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Node.js — <code className="bg-gray-100 px-1 rounded">npm install ioredis</code>
              </p>
              <ThemeableCodeBlock code={clientExamples.node} language="node" />
            </div>
          )}
          {activeTab === "python" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Python — <code className="bg-gray-100 px-1 rounded">pip install redis</code>
              </p>
              <ThemeableCodeBlock code={clientExamples.python} language="python" />
            </div>
          )}
          {activeTab === "cli" && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Connect directly using <code className="bg-gray-100 px-1 rounded">redis-cli</code> on port 6380.
              </p>
              <ThemeableCodeBlock code={clientExamples.cli} language="cli" />
            </div>
          )}
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
                {externalResources.map((r, idx) => (
                  <tr key={`${r.name}-${r.url}-${idx}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline font-medium"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
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

      {showModal && <RedisModal onClose={() => setShowModal(false)} />}
    </main>
  );
}
