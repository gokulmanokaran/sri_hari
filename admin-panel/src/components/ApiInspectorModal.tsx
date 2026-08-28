import { useState, useEffect } from "react";
import { X, Code, CheckCircle2, Copy, ExternalLink, RefreshCw, Server, Save } from "lucide-react";
import { getApiBaseUrl, setCustomApiUrl, fetchProducts } from "../services/api";
import { Product } from "../types";

interface ApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiInspectorModal({ isOpen, onClose }: ApiInspectorModalProps) {
  if (!isOpen) return null;

  const currentBaseUrl = getApiBaseUrl();
  const [customUrlInput, setCustomUrlInput] = useState(currentBaseUrl);
  const [sampleData, setSampleData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fullApiBase = currentBaseUrl.startsWith("http")
    ? currentBaseUrl
    : `${window.location.origin}${currentBaseUrl}`;

  const productsApiUrl = `${fullApiBase}/products`;
  const categoriesApiUrl = `${fullApiBase}/categories`;

  const loadPreview = () => {
    setLoading(true);
    fetchProducts()
      .then((data) => setSampleData(data.slice(0, 3)))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveApiUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    const targetUrl = customUrlInput.trim();
    setCustomApiUrl(targetUrl === "/api" ? null : targetUrl);

    try {
      const activeBase = targetUrl.startsWith("http")
        ? targetUrl
        : `${window.location.origin}${targetUrl}`;
      const res = await fetch(`${activeBase}/products?_ts=${Date.now()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const text = await res.text();
      if (text.startsWith("<") || text.includes("<!DOCTYPE")) {
        throw new Error("Target returned HTML instead of JSON. Ensure URL points to the store API (e.g. https://your-store.vercel.app/api).");
      }

      const json = JSON.parse(text);
      const count = Array.isArray(json.data) ? json.data.length : Array.isArray(json) ? json.length : 0;
      setTestResult({
        success: true,
        msg: `✓ Connected successfully! Found ${count} live products.`,
      });
      loadPreview();
    } catch (err) {
      setTestResult({
        success: false,
        msg: err instanceof Error ? `Connection Failed: ${err.message}` : "Failed to connect to API.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDefault = () => {
    setCustomApiUrl(null);
    setCustomUrlInput("/api");
    setTestResult({ success: true, msg: "Reset to default relative API (/api)." });
    loadPreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Code size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Central Product API & Endpoints</h2>
              <p className="text-xs text-slate-400">
                Unified persistent JSON source for Storefront, Admin Panel & Android App
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active API URL Configuration Form */}
          <form onSubmit={handleSaveApiUrl} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server size={14} className="text-[#00A651]" />
                API Connection URL
              </label>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset to Default (/api)
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              If your Admin Panel is hosted on a separate domain from your main store, enter your main website API URL below (e.g. <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded font-mono">https://sri-hari.vercel.app/api</code>).
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="/api or https://your-site.vercel.app/api"
                className="flex-1 h-10 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#00A651]"
              />
              <button
                type="submit"
                disabled={testing}
                className="h-10 px-4 bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {testing ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save & Test</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  testResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                }`}
              >
                {testResult.msg}
              </div>
            )}
          </form>

          {/* Endpoints */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Product Endpoints
            </h3>

            {/* Products Endpoint */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 font-mono mb-1">
                  GET
                </span>
                <p className="text-xs text-white font-mono truncate">{productsApiUrl}</p>
                <p className="text-[10px] text-slate-500">Fetches live 90+ product catalog with prices, stock, and images</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(productsApiUrl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <a
                  href={productsApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Categories Endpoint */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 font-mono mb-1">
                  GET
                </span>
                <p className="text-xs text-white font-mono truncate">{categoriesApiUrl}</p>
                <p className="text-[10px] text-slate-500">Fetches store categories and display colors/emojis</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyUrl(categoriesApiUrl)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
                <a
                  href={categoriesApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {copied && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
              ✓ URL Copied to clipboard!
            </div>
          )}

          {/* Sample JSON Payload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Live JSON Response Preview
              </h3>
              {loading && <RefreshCw size={14} className="animate-spin text-slate-400" />}
            </div>
            <pre className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
              {JSON.stringify(sampleData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 size={16} />
            <span>Central API is operational and ready for Android</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
