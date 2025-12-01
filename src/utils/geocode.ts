import axios from "axios";

export const getCoordinates = async (address: string) => {
  if (!address) throw new Error("Destination is required");

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/geocode/json`;

  const response = await axios.get(url, {
    params: { address, key: apiKey },
  });

  if (response.data.status !== "OK") {
    throw new Error(
      `Google Maps API Error: ${response.data.status} - ${
        response.data.error_message || "No message"
      }`
    );
  }

  const location = response.data.results[0].geometry.location;

  return {
    latitude: location.lat,
    longitude: location.lng,
  };
};
