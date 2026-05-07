import { useState, useEffect } from "react";

// Returns the current "route" based on the URL hash.
// "" or "#" => main app
// "#admin"  => admin/builder page
export function useRoute() {
  const [route, setRoute] = useState(window.location.hash.replace(/^#/, ""));
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.replace(/^#/, ""));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}

export function navigate(route) {
  window.location.hash = route;
}
