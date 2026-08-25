import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  ChevronRight,
  Navigation,
  Loader2,
  Search,
  X,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import type { DeliveryLocation } from "../../utils/validation";

// Default centre: Coimbatore, Tamil Nadu
const DEFAULT_LAT = 11.0168;
const DEFAULT_LNG = 76.9558;

export interface MapLocationResult extends Omit<DeliveryLocation, "houseNo" | "landmark"> {}

interface MapLocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (result: MapLocationResult) => void;
  onClose: () => void;
}

interface ParsedAddress {
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

interface SearchSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

// Custom Green Pin Icon for Leaflet
const createCustomPinIcon = () => {
  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="position: relative; width: 38px; height: 50px; transform: translate(-50%, -100%); cursor: grab;">
        <svg width="38" height="50" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));">
          <path d="M19 0C8.507 0 0 8.507 0 19c0 13.435 19 31 19 31S38 32.435 38 19C38 8.507 29.493 0 19 0z" fill="#00A651"/>
          <circle cx="19" cy="19" r="7.5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export function MapLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  const startLat = initialLat && initialLat !== 0 ? initialLat : DEFAULT_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DEFAULT_LNG;

  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [parsed, setParsed] = useState<ParsedAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  // Places Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reverse Geocode Function ──────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    setSelectedLatLng({ lat, lng });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const street = [addr.house_number, addr.road || addr.street].filter(Boolean).join(", ");
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.village || "";
        const city = addr.city || addr.town || addr.municipality || "Coimbatore";
        const district = addr.county || addr.state_district || "Coimbatore";
        const state = addr.state || "Tamil Nadu";
        const pincode = addr.postcode || "";
        const formattedAddress = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        setParsed({ street, area, city, district, state, pincode, formattedAddress });
        setGeocoding(false);
        return;
      }
    } catch (err) {
      console.warn("Reverse geocode notice:", err);
    }

    // Fallback if network issue
    setParsed({
      street: "",
      area: "",
      city: "Coimbatore",
      district: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "",
      formattedAddress: `Location: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`,
    });
    setGeocoding(false);
  }, []);

  // ── Place or Move Marker ───────────────────────────────────────────────────
  const setPin = useCallback(
    (lat: number, lng: number, map: L.Map, pan = true) => {
      if (pan) {
        map.panTo([lat, lng], { animate: true });
      }

      if (!markerInstanceRef.current) {
        const marker = L.marker([lat, lng], {
          icon: createCustomPinIcon(),
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });

        markerInstanceRef.current = marker;
      } else {
        markerInstanceRef.current.setLatLng([lat, lng]);
      }

      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // ── Initialize Map on Mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent re-initialization on hot reloads
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: false,
    });

    // Clean, crisp high-res tiles (Carto Voyager - fast, modern, and beautiful)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Click anywhere on map to drop pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      setPin(e.latlng.lat, e.latlng.lng, map, false);
    });

    mapInstanceRef.current = map;
    setLoading(false);

    // If initial location provided, drop pin
    if (initialLat && initialLng) {
      setPin(initialLat, initialLng, map, true);
    }

    // Invalidate map size after animation finishes
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerInstanceRef.current = null;
    };
  }, [startLat, startLng, initialLat, initialLng, setPin]);

  // ── Search Input Suggestions (Debounced) ───────────────────────────────────
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query + ", Tamil Nadu, India"
          )}&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const results = await res.json();
          setSuggestions(
            results.map((item: { display_name: string; lat: string; lon: string }) => ({
              displayName: item.display_name,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }))
          );
        }
      } catch (err) {
        console.warn("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSuggestion = (item: SearchSuggestion) => {
    setSearchQuery("");
    setSuggestions([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([item.lat, item.lng], 16, { animate: true });
      setPin(item.lat, item.lng, mapInstanceRef.current, false);
    }
  };

  // ── GPS: Use Current Location ──────────────────────────────────────────────
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLocating(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
          setPin(lat, lng, mapInstanceRef.current, false);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [locating, setPin]);

  // ── Confirm Location ───────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (!selectedLatLng || !parsed) return;
    onConfirm({
      lat: selectedLatLng.lat,
      lng: selectedLatLng.lng,
      formattedAddress: parsed.formattedAddress,
      street: parsed.street,
      area: parsed.area,
      city: parsed.city,
      district: parsed.district,
      state: parsed.state,
      pincode: parsed.pincode,
    });
  }, [selectedLatLng, parsed, onConfirm]);

  const hasLocation = selectedLatLng !== null && parsed !== null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ fontFamily: "inherit" }}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 bg-white flex-shrink-0"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
          paddingBottom: 12,
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-[#111111] flex-shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-[#111111] leading-tight">Select delivery location</h1>
          <p className="text-[12px] text-[#888888]">Tap anywhere on the map to place your pin</p>
        </div>
      </div>

      {/* ── Search Input & Suggestions ──────────────────────────────────────── */}
      <div className="relative bg-white px-4 py-3 border-b border-[#F0F0F0] flex-shrink-0 z-20">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-[#888888] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search street, area, or landmark in Coimbatore…"
            className="w-full h-11 pl-10 pr-10 bg-[#F5F5F5] rounded-[12px] text-sm font-medium text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 transition-all"
            autoComplete="off"
          />
          {isSearching && (
            <Loader2 size={16} className="absolute right-3 animate-spin text-[#00A651]" />
          )}
          {searchQuery && !isSearching && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="absolute right-3 text-[#AAAAAA] hover:text-[#444444] cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-[16px] shadow-2xl border border-[#EAEAEA] overflow-hidden z-30 divide-y divide-gray-100">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-3 text-left hover:bg-[#F5FCF8] flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin size={16} className="text-[#00A651] mt-0.5 flex-shrink-0" />
                <span className="text-xs font-semibold text-[#111111] line-clamp-2">
                  {item.displayName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Interactive Map Canvas ──────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-[#EAEAEA]">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#EAEAEA] gap-3">
            <Loader2 size={30} className="animate-spin text-[#00A651]" />
            <p className="text-sm text-gray-500 font-medium">Loading interactive map…</p>
          </div>
        )}

        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />

        {/* Tap Prompt Banner */}
        {!hasLocation && (
          <div
            className="absolute z-10 flex justify-center pointer-events-none"
            style={{ top: 14, left: 0, right: 0 }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.8)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 20,
                padding: "7px 18px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              👆 Tap anywhere on the map to drop your delivery pin
            </div>
          </div>
        )}

        {/* Geocoding Spinner Badge */}
        {geocoding && (
          <div className="absolute top-4 right-4 z-10 bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md border border-gray-200">
            <Loader2 size={13} className="animate-spin text-[#00A651]" />
            <span className="text-xs font-semibold text-[#555555]">Detecting address…</span>
          </div>
        )}

        {/* GPS Button */}
        <div
          className="absolute z-10 flex justify-center"
          style={{ bottom: 16, left: 0, right: 0, pointerEvents: "none" }}
        >
          <button
            onClick={handleCurrentLocation}
            disabled={locating}
            className="flex items-center gap-2 bg-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 pointer-events-auto"
            style={{ color: "#00A651" }}
            aria-label="Use current location"
          >
            <Navigation
              size={16}
              className={`flex-shrink-0 ${locating ? "animate-pulse" : ""}`}
              style={{ color: "#00A651" }}
            />
            {locating ? "Locating…" : "Use my current location"}
          </button>
        </div>
      </div>

      {/* ── Bottom Address Details & Confirm ─────────────────────────────────── */}
      <div className="bg-white flex-shrink-0 border-t border-[#F0F0F0]">
        {hasLocation && parsed ? (
          <div className="px-4 pt-4 pb-2">
            {/* Delivery Heading */}
            <div className="flex items-center gap-2 mb-2.5">
              <MapPin size={15} className="text-[#00A651] flex-shrink-0" />
              <p className="text-[13px] font-black text-[#111111]">Delivering to</p>
              <span className="ml-auto text-[11px] text-[#00A651] font-bold bg-[#EAF8F0] px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Pin placed
              </span>
            </div>

            {/* Address Details Card */}
            <div className="bg-[#F9F9F9] rounded-[14px] px-3.5 py-3 mb-3 space-y-1.5 border border-[#EEEEEE]">
              {parsed.formattedAddress && (
                <p className="text-[13px] font-semibold text-[#111111] leading-snug">
                  {parsed.formattedAddress}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {parsed.street && <Chip color="blue" label={parsed.street} />}
                {parsed.area && <Chip color="green" label={parsed.area} />}
                {parsed.city && <Chip color="green" label={`🏙 ${parsed.city}`} />}
                {parsed.district && <Chip color="gray" label={parsed.district} />}
                {parsed.state && <Chip color="gray" label={parsed.state} />}
                {parsed.pincode && <Chip color="green" label={`📮 ${parsed.pincode}`} bold />}
              </div>
            </div>

            <p className="text-[11px] text-[#AAAAAA] text-center mb-2">
              Tip: You can drag the green pin or tap another spot to adjust.
            </p>
          </div>
        ) : (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 bg-[#F5F5F5] rounded-[14px] p-3.5">
              <MapPin size={18} className="text-[#AAAAAA]" />
              <p className="text-sm text-[#AAAAAA] font-medium">
                No location selected yet — tap the map above
              </p>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <div
          className="px-4"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 14px), 14px)" }}
        >
          <button
            onClick={handleConfirm}
            disabled={!hasLocation || geocoding}
            className="w-full bg-[#00A651] hover:bg-[#087A43] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed active:scale-[0.98] text-white font-bold text-base rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            style={{ height: 52 }}
          >
            {geocoding ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Detecting address…
              </>
            ) : hasLocation ? (
              <>
                Confirm Location
                <ChevronRight size={20} strokeWidth={2.5} />
              </>
            ) : (
              "Tap the map to select a location"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small reusable chip
function Chip({
  label,
  color,
  bold,
}: {
  label: string;
  color: "green" | "gray" | "blue";
  bold?: boolean;
}) {
  const styles: Record<string, string> = {
    green: "bg-[#EAF8F0] text-[#087A43]",
    gray: "bg-[#F0F0F0] text-[#555555]",
    blue: "bg-[#EBF3FF] text-[#1A73E8]",
  };
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full ${styles[color]} ${
        bold ? "font-bold" : "font-semibold"
      }`}
    >
      {label}
    </span>
  );
}
