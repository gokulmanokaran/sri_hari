import { useState, useEffect } from "react";
import { X, Code, CheckCircle2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { getApiBaseUrl, fetchProducts } from "../services/api";
import { Product } from "../types";

interface ApiInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiInspectorModal({ isOpen, onClose }: ApiInspectorModalProps) {
  if (!isOpen) return null;

  const baseUrl = getApiBaseUrl();
  const [sampleData, setSampleData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const productsApiUrl = `${window.location.origin}${baseUrl}/products`;
  const categoriesApiUrl = `${window.location.origin}${baseUrl}/categories`;

  useEffect(() => {
    setLoading(true);
    fetchProducts()
      .then((data) => setSampleData(data.slice(0, 3)))
      .catch((e) => console.warn(e))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <h2 className="text-base font-black text-white">Central Product API & Android Endpoints</h2>
              <p className="text-xs text-slate-400">
                Single unified JSON source for Website, Admin Panel & Android App
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
          {/* Endpoints */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Public Live Endpoints (Zero Play Store Updates Needed)
            </h3>

            {/* Products Endpoint */}
            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 font-mono mb-1">
                  GET
                </span>
                <p className="text-xs text-white font-mono truncate">{productsApiUrl}</p>
                <p className="text-[10px] text-slate-500">Fetches live 80+ product catalog with prices, stock, and images</p>
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

          {/* Android Kotlin Integration Snippet */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Future Android App Integration (Retrofit Kotlin)
            </h3>
            <pre className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl text-[11px] font-mono text-blue-300 overflow-x-auto">
{`interface SriHariApiService {
    @GET("products")
    suspend fun getProducts(): ApiResponse<List<ProductDto>>

    @GET("categories")
    suspend fun getCategories(): ApiResponse<List<CategoryDto>>
}`}
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
