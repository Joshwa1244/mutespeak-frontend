import { getToken } from "./authService";

const BACKEND_BASE = 
"http://localhost:8080";
//"https://site--mutespeak-backend--22t95wnlrvvt.code.run";
const API_BASE = `${BACKEND_BASE}/api/news`;

export async function getNews() {
  const token = getToken();

  const response = await fetch(API_BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch news");
  }

  const data = await response.json();

  // Sort descending by discoveredAt date so newest is top
  return data.sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
}