import React, { useState } from "react";
import { X, Plus, Save, AlertCircle } from "lucide-react";
import { Category } from "../types";
import { saveCategory } from "../services/api";

interface CategoryModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export function CategoryModal({
  categories,
  isOpen,
  onClose,
  onRefresh,
}: CategoryModalProps) {
  if (!isOpen) return null;

  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌿");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#EAF8F0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) {
      setError("Category ID and Name are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await saveCategory({
        id: newId.trim().toLowerCase().replace(/\s+/g, "-"),
        name: newName.trim(),
        emoji: newEmoji.trim() || "🌿",
        description: newDesc.trim(),
        color: newColor.trim() || "#EAF8F0",
        active: true,
        sortOrder: categories.length + 1,
      });

      setSuccess(`Category "${newName}" added successfully!`);
      setNewId("");
      setNewName("");
      setNewDesc("");
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Manage Categories</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Categories dynamically organize the storefront and mobile app.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              ✓ {success}
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleAddCategory} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-[#00A651] uppercase tracking-wider flex items-center gap-1.5">
              <Plus size={14} /> Add New Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Category ID
                </label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="e.g. herbal-teas"
                  required
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Herbal Teas"
                  required
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Emoji Icon
                </label>
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  placeholder="🍵"
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-base text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description (optional)..."
                className="flex-1 mr-3 h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
              />
              <button
                type="submit"
                disabled={loading || !newId || !newName}
                className="h-10 px-4 bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save size={14} />
                <span>Save</span>
              </button>
            </div>
          </form>

          {/* Current Categories List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Existing Categories ({categories.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center gap-3"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-xs flex-shrink-0"
                    style={{ background: c.color || "#EAF8F0" }}
                  >
                    {c.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">ID: {c.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end">
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
