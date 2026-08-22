import { useCallback, useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { ArrowLeft, ChevronRight, Navigation, Loader2 } from "lucide-react";

// Default location: Coimbatore, Tamil Nadu
const DEFAULT_LAT = 11.0168;
const DEFAULT_LNG = 76.9558;

export interface MapLocationResult {
  lat: number;
  lng: number;
  address?: string;
}

interface MapLocationPickerProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirm: (result: MapLocationResult) => void;
  onClose: () => void;
}

let isGoogleConfigured = false;

export function MapLocationPicker({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: MapLocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLat = initialLat && initialLat !== 0 ? initialLat : DEFAULT_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DEFAULT_LNG;

  const [center, setCenter] = useState({ lat: startLat, lng: startLng });
  const [address, setAddress] = useState<string>("Detecting address…");
  const [subAddress, setSubAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [locating, setLocating] = useState(false);

  // Reverse geocoding via Google Geocoding API
  const doReverseGeocode = useCallback((lat: number, lng: number) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      if (geocoderRef.current) {
        try {
          const res = await geocoderRef.current.geocode({ location: { lat, lng } });
          if (res.results && res.results.length > 0) {
            const first = res.results[0];
            const primary = first.address_components?.[0]?.long_name ?? "Selected Location";
            setAddress(primary);
            setSubAddress(first.formatted_address || `${primary}, Tamil Nadu`);
            return;
          }
        } catch {
          // Fallback if Geocoding API unavailable
        }
      }
      setAddress("Selected Delivery Location");
      setSubAddress(`Coordinates: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
    }, 400);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

    if (!isGoogleConfigured) {
      setOptions({
        key: apiKey,
        v: "weekly",
      });
      isGoogleConfigured = true;
    }

    async function initGoogleMap() {
      try {
        const { Map } = await importLibrary("maps");
        const { Geocoder } = await importLibrary("geocoding");

        if (!isMounted || !mapContainerRef.current) return;

        const centerPos = { lat: startLat, lng: startLng };

        const map = new Map(mapContainerRef.current, {
          center: centerPos,
          zoom: 16,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
        });

        geocoderRef.current = new Geocoder();

        map.addListener("dragstart", () => {
          if (isMounted) setDragging(true);
        });

        map.addListener("idle", () => {
          if (!isMounted) return;
          setDragging(false);
          const c = map.getCenter();
          if (c) {
            const currentLat = c.lat();
            const currentLng = c.lng();
            setCenter({ lat: currentLat, lng: currentLng });
            doReverseGeocode(currentLat, currentLng);
          }
        });

        mapRef.current = map;
        setLoading(false);
        doReverseGeocode(startLat, startLng);
      } catch (err) {
        if (!isMounted) return;
        console.warn("Google Maps load fallback:", err);
        setLoading(false);
        setAddress("Selected Delivery Location");
        setSubAddress(`Coordinates: ${startLat.toFixed(4)}° N, ${startLng.toFixed(4)}° E`);
      }
    }

    initGoogleMap();

    return () => {
      isMounted = false;
      mapRef.current = null;
      geocoderRef.current = null;
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, [startLat, startLng, doReverseGeocode]);

  // GPS "Use current location" button
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setLocating(false);
        setCenter({ lat, lng });
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(17);
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [locating]);

  const handleConfirm = useCallback(() => {
    onConfirm({
      lat: center.lat,
      lng: center.lng,
      address: subAddress || address,
    });
  }, [center, address, subAddress, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ fontFamily: "inherit" }}>
      {/* ── Header ── */}
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
        <h1 className="text-[17px] font-bold text-[#111111]">Confirm location</h1>
      </div>

      {/* ── Google Map Section ── */}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-[#E5E3DF]">
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#E5E3DF] gap-3">
            <Loader2 size={30} className="animate-spin text-[#4285F4]" />
            <p className="text-sm text-gray-500 font-medium">Loading Google Maps…</p>
          </div>
        )}

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* ── Fixed Center Red Pin Overlay ── */}
        {!loading && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{ zIndex: 10 }}
          >
            {/* Ground Contact Shadow */}
            <div
              style={{
                position: "absolute",
                top: "calc(50% + 24px)",
                width: 18,
                height: 6,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.25)",
                filter: "blur(2px)",
              }}
            />
            {/* Google Maps Official Style Red Pin */}
            <svg
              width="38"
              height="50"
              viewBox="0 0 38 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                marginBottom: 4,
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
              }}
            >
              <path
                d="M19 0C8.507 0 0 8.507 0 19c0 13.435 19 31 19 31S38 32.435 38 19C38 8.507 29.493 0 19 0z"
                fill="#EA4335"
              />
              <circle cx="19" cy="19" r="7.5" fill="white" />
            </svg>
          </div>
        )}

        {/* ── "Move the map" Tooltip ── */}
        {!loading && !dragging && (
          <div
            className="absolute z-10 flex justify-center pointer-events-none"
            style={{
              top: "calc(50% - 68px)",
              left: 0,
              right: 0,
            }}
          >
            <div
              style={{
                background: "rgba(0,0,0,0.82)",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 20,
                padding: "7px 16px",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              Move the map to adjust your location
            </div>
          </div>
        )}

        {/* ── "Use current location" GPS Button ── */}
        {!loading && (
          <div
            className="absolute z-10 flex justify-center"
            style={{ bottom: 16, left: 0, right: 0 }}
          >
            <button
              onClick={handleCurrentLocation}
              disabled={locating}
              className="flex items-center gap-2 bg-white font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
              style={{ color: "#00A651", minWidth: 200 }}
              aria-label="Use current location"
            >
              <Navigation
                size={16}
                className={`flex-shrink-0 ${locating ? "animate-pulse" : ""}`}
                style={{ color: "#00A651" }}
              />
              {locating ? "Locating…" : "Use current location"}
            </button>
          </div>
        )}
      </div>

      {/* ── "Delivering your order to" Bottom Section ── */}
      <div
        className="bg-white flex-shrink-0"
        style={{ borderTop: "1px solid #F0F0F0", paddingTop: 16, paddingBottom: 8 }}
      >
        <p
          className="font-black text-[#111111]"
          style={{ fontSize: 16, paddingLeft: 16, paddingRight: 16, marginBottom: 10 }}
        >
          Delivering your order to
        </p>

        {/* Address Card */}
        <div
          className="mx-4 flex items-start gap-3 rounded-xl bg-white"
          style={{
            border: "1px solid #E8E8E8",
            padding: "12px 14px",
            marginBottom: 14,
            minHeight: 56,
          }}
        >
          <div className="flex-shrink-0 mt-0.5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C8.134 2 5 5.134 5 9c0 5.303 7 13 7 13s7-7.697 7-13c0-3.866-3.134-7-7-7z"
                fill="#111111"
              />
              <circle cx="12" cy="9" r="2.5" fill="white" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#111111] text-sm leading-snug">{address}</p>
            {subAddress && subAddress !== address && (
              <p className="text-xs text-gray-500 leading-snug mt-0.5 line-clamp-2">{subAddress}</p>
            )}
          </div>
        </div>

        {/* Confirm Location Button */}
        <div className="px-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 12px), 12px)" }}>
          <button
            onClick={handleConfirm}
            className="w-full bg-[#00A651] hover:bg-[#087A43] active:scale-[0.98] text-white font-bold text-base rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
            style={{ height: 52 }}
          >
            Confirm Location
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
