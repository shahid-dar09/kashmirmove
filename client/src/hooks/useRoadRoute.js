import { useState, useEffect, useRef } from 'react';

/**
 * useRoadRoute — Fetches a real road-network route from the OSRM public API.
 *
 * @param {Array<[number, number]>} waypoints - Array of [lat, lng] pairs
 * @returns {{ routePoints: Array, distanceKm: number|null, durationMin: number|null, loading: boolean }}
 */
const routeCache = new Map();

const useRoadRoute = (waypoints) => {
  const [routePoints, setRoutePoints] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    // Need at least 2 valid points to route
    if (!waypoints || waypoints.length < 2) {
      Promise.resolve().then(() => {
        setRoutePoints([]);
        setDistanceKm(null);
        setDurationMin(null);
      });
      return;
    }

    // Check all points are valid
    const valid = waypoints.every(
      p => p && Array.isArray(p) && p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])
    );
    if (!valid) return;

    // Build OSRM coordinate string: lng,lat;lng,lat (OSRM uses lng,lat order)
    const coordStr = waypoints.map(p => `${p[1]},${p[0]}`).join(';');
    const cacheKey = coordStr;

    // Return cached result if available
    if (routeCache.has(cacheKey)) {
      const cached = routeCache.get(cacheKey);
      Promise.resolve().then(() => {
        setRoutePoints(cached.routePoints);
        setDistanceKm(cached.distanceKm);
        setDurationMin(cached.durationMin);
      });
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: abortRef.current.signal });
        
        if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
        
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes?.length) {
          // Fallback to straight-line if OSRM can't find a route
          setRoutePoints(waypoints);
          setDistanceKm(null);
          setDurationMin(null);
          return;
        }

        const route = data.routes[0];

        // GeoJSON coordinates are [lng, lat] — convert to [lat, lng] for Leaflet
        const points = route.geometry.coordinates.map(c => [c[1], c[0]]);
        const distKm = (route.distance / 1000).toFixed(1);
        const durMin = Math.round(route.duration / 60);

        // Cache the result
        routeCache.set(cacheKey, { routePoints: points, distanceKm: distKm, durationMin: durMin });

        setRoutePoints(points);
        setDistanceKm(distKm);
        setDurationMin(durMin);
      } catch (err) {
        if (err.name === 'AbortError') return; // Intentional cancel
        console.warn('Road routing failed, falling back to straight line:', err.message);
        // Fallback: use straight line
        setRoutePoints(waypoints);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [waypoints?.map(p => p?.join(',')).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { routePoints, distanceKm, durationMin, loading };
};

export default useRoadRoute;
