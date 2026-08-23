import { useCallback, useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { ArrowLeft, ChevronRight, Navigation, Loader2, Search, X, MapPin } from "lucide-react";
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

let isGoogleConfigured = false;

// ─── Address Component Parser ────────────────────────────────────────────────
interface ParsedAddress {
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  formattedAddress: string;
}

function parseComponents(
  components: google.maps.GeocoderAddressComponent[],
  formattedAddress: string
): ParsedAddress {
  const get = (types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? "";

  // Door number + street/road
  const streetNumber = get(["street_number", "premise"]);
  const route = get(["route", "sublocality_level_2"]);
  const street = [streetNumber, route].filter(Boolean).join(", ");

  // Neighbourhood / locality / area
  const area =
    get(["sublocality_level_1", "sublocality", "neighborhood", "political"]) ||
    get(["administrative_area_level_4", "administrative_area_level_3"]);

  const city = get(["locality"]) || get(["administrative_area_level_3"]);
  const district = get(["administrative_area_level_2"]);
  const state = get(["administrative_area_level_1"]);
  const pincode = get(["postal_code"]);

  return { street, area, city, district, state, pincode, formattedAddress };
}

// ─── Component ───────────────────────────────────────────────────────────────
export function MapLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const startLat = initialLat && initialLat !== 0 ? initialLat : DEFAULT_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DEFAULT_LNG;

  const [parsed, setParsed] = useState<ParsedAddress | null>(null);
  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Reverse-geocode a lat/lng and update parsed state ──────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    setSelectedLatLng({ lat, lng });

    if (geocoderRef.current) {
      try {
        const res = await geocoderRef.current.geocode({ location: { lat, lng } });
        if (res.results?.length) {
          const first = res.results[0];
          const p = parseComponents(first.address_components ?? [], first.formatted_address ?? "");
          setParsed(p);
          setGeocoding(false);
          return;
        }
      } catch { /* fall through */ }
    }
    // Fallback when geocoder unavailable
    setParsed({
      street: "",
      area: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      formattedAddress: `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`,
    });
    setGeocoding(false);
  }, []);

  // ── Place/move the marker ─────────────────────────────────────────────────
  const placeMarker = useCallback(
    (lat: number, lng: number, map: google.maps.Map) => {
      if (markerRef.current) {
        markerRef.current.position = { lat, lng };
      }
      map.panTo({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // ── Init Google Maps ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    if (!isGoogleConfigured) {
      setOptions({ key: apiKey, v: "weekly" });
      isGoogleConfigured = true;
    }

    async function init() {
      try {
        const [{ Map }, { Geocoder }, { Autocomplete }, { AdvancedMarkerElement }] =
          await Promise.all([
            importLibrary("maps") as Promise<google.maps.MapsLibrary>,
            importLibrary("geocoding") as Promise<google.maps.GeocodingLibrary>,
            importLibrary("places") as Promise<google.maps.PlacesLibrary>,
            importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
          ]);

        if (!isMounted || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
          center: { lat: startLat, lng: startLng },
          zoom: 14,
          mapId: "shreehari_delivery_map",
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          clickableIcons: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        });

        geocoderRef.current = new Geocoder();
        mapRef.current = map;

        // ── Create the draggable marker (hidden until user clicks) ──────────
        const markerEl = document.createElement("div");
        markerEl.style.cssText = `
          width: 36px; height: 48px; cursor: grab;
          display: flex; align-items: flex-end; justify-content: center;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        `;
        markerEl.innerHTML = `
          <svg width="36" height="48" viewBox="0 0 38 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 0C8.507 0 0 8.507 0 19c0 13.435 19 31 19 31S38 32.435 38 19C38 8.507 29.493 0 19 0z" fill="#00A651"/>
            <circle cx="19" cy="19" r="7.5" fill="white"/>
          </svg>
        `;

        const marker = new AdvancedMarkerElement({
          map,
          position: null, // hidden initially
          content: markerEl,
          gmpDraggable: true,
          title: "Delivery location",
        });
        markerRef.current = marker;

        // If we already have a location (re-opening picker), place marker
        if (initialLat && initialLng) {
          marker.position = { lat: initialLat, lng: initialLng };
          if (isMounted) reverseGeocode(initialLat, initialLng);
        }

        // ── Map click → place marker ────────────────────────────────────────
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || !isMounted) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          placeMarker(lat, lng, map);
        });

        // ── Marker drag end → geocode new position ──────────────────────────
        marker.addListener("dragend", () => {
          const pos = marker.position;
          if (!pos || !isMounted) return;
          const lat = typeof pos === "object" && "lat" in pos
            ? (pos as google.maps.LatLngLiteral).lat
            : (pos as google.maps.LatLng).lat();
          const lng = typeof pos === "object" && "lng" in pos
            ? (pos as google.maps.LatLngLiteral).lng
            : (pos as google.maps.LatLng).lng();
          if (isMounted) reverseGeocode(lat, lng);
        });

        // ── Places Autocomplete ─────────────────────────────────────────────
        if (searchInputRef.current) {
          const ac = new Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: "in" },
            fields: ["geometry", "formatted_address", "address_components"],
          });
          autocompleteRef.current = ac;

          ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            if (!isMounted) return;

            setSearchQuery("");
            map.panTo({ lat, lng });
            map.setZoom(17);
            marker.position = { lat, lng };

            const p = parseComponents(
              place.address_components ?? [],
              place.formatted_address ?? ""
            );
            setParsed(p);
            setSelectedLatLng({ lat, lng });
          });
        }

        setLoading(false);
      } catch (err) {
        console.warn("Google Maps init error:", err);
        if (isMounted) setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      mapRef.current = null;
      geocoderRef.current = null;
      markerRef.current = null;
      autocompleteRef.current = null;
    };
  }, [startLat, startLng, initialLat, initialLng, reverseGeocode, placeMarker]);

  // ── GPS: use current location ──────────────────────────────────────────────
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLocating(false);
        if (mapRef.current && markerRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
          markerRef.current.position = { lat, lng };
          reverseGeocode(lat, lng);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [locating, reverseGeocode]);

  // ── Confirm ────────────────────────────────────────────────────────────────
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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

      {/* ── Places Search ──────────────────────────────────────────────────── */}
      <div className="bg-white px-4 py-3 border-b border-[#F0F0F0] flex-shrink-0">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-[#888888] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search street, area, or landmark…"
            className="w-full h-11 pl-10 pr-10 bg-[#F5F5F5] rounded-[12px] text-sm font-medium text-[#111111] placeholder-[#AAAAAA] focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 transition-all"
            id="location-search-input"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-[#AAAAAA] cursor-pointer"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Map ────────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-[#E5E3DF]">

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#E5E3DF] gap-3">
            <Loader2 size={30} className="animate-spin text-[#00A651]" />
            <p className="text-sm text-gray-500 font-medium">Loading map…</p>
          </div>
        )}

        {/* Map canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* "Tap to place pin" prompt — shown only when no pin placed yet */}
        {!loading && !hasLocation && (
          <div
            className="absolute z-10 flex justify-center pointer-events-none"
            style={{ top: 14, left: 0, right: 0 }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.78)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 20,
                padding: "7px 18px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              👆 Tap the map to drop your delivery pin
            </div>
          </div>
        )}

        {/* Geocoding spinner overlay on map */}
        {geocoding && (
          <div className="absolute top-4 right-4 z-10 bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
            <Loader2 size={13} className="animate-spin text-[#00A651]" />
            <span className="text-xs font-semibold text-[#555555]">Fetching address…</span>
          </div>
        )}

        {/* GPS button */}
        {!loading && (
          <div
            className="absolute z-10 flex justify-center"
            style={{ bottom: 16, left: 0, right: 0 }}
          >
            <button
              onClick={handleCurrentLocation}
              disabled={locating}
              className="flex items-center gap-2 bg-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
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
        )}
      </div>

      {/* ── Address Preview + Confirm ───────────────────────────────────────── */}
      <div
        className="bg-white flex-shrink-0"
        style={{ borderTop: "1px solid #F0F0F0" }}
      >
        {hasLocation && parsed ? (
          <div className="px-4 pt-4 pb-2">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-[#00A651] flex-shrink-0" />
              <p className="text-[13px] font-black text-[#111111]">Delivering to</p>
              <span className="ml-auto text-[11px] text-[#00A651] font-bold bg-[#EAF8F0] px-2 py-0.5 rounded-full">
                ✓ Pin placed
              </span>
            </div>

            {/* Address detail chips */}
            <div className="bg-[#F9F9F9] rounded-[14px] px-3.5 py-3 mb-3 space-y-1.5">
              {parsed.formattedAddress && (
                <p className="text-[13px] font-semibold text-[#111111] leading-snug">
                  {parsed.formattedAddress}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {parsed.street && (
                  <Chip color="blue" label={parsed.street} />
                )}
                {parsed.area && (
                  <Chip color="green" label={parsed.area} />
                )}
                {parsed.city && (
                  <Chip color="green" label={`🏙 ${parsed.city}`} />
                )}
                {parsed.district && (
                  <Chip color="gray" label={parsed.district} />
                )}
                {parsed.state && (
                  <Chip color="gray" label={parsed.state} />
                )}
                {parsed.pincode && (
                  <Chip color="green" label={`📮 ${parsed.pincode}`} bold />
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#AAAAAA] text-center mb-2">
              Not right? Tap another spot on the map or drag the pin.
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

        {/* Confirm button */}
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
                Fetching address…
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
function Chip({ label, color, bold }: { label: string; color: "green" | "gray" | "blue"; bold?: boolean }) {
  const styles: Record<string, string> = {
    green: "bg-[#EAF8F0] text-[#087A43]",
    gray: "bg-[#F0F0F0] text-[#555555]",
    blue: "bg-[#EBF3FF] text-[#1A73E8]",
  };
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full ${styles[color]} ${bold ? "font-bold" : "font-semibold"}`}
    >
      {label}
    </span>
  );
}
