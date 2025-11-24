const API_URL = "https://hotel-api.medyvillarias36.workers.dev";

export const api = {
  getRooms: () => fetch(`${API_URL}/api/rooms`).then(r => r.json()),
  getServices: () => fetch(`${API_URL}/api/services`).then(r => r.json()),
};