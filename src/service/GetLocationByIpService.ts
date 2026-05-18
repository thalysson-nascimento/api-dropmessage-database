import axios from "axios";

interface LocationResponse {
  state: string;
  stateCode: string;
  city: string;
  continent: string;
  country: string;
  countryCode: string;
  currency: string;
}

export class GetLocationByIpService {
  async execute(ip: string): Promise<LocationResponse> {
    try {
      const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);

      return {
        state: data.region || "",
        stateCode: data.region_code || "",
        city: data.city || "",
        continent: data.continent_code || "",
        country: data.country_name || "",
        countryCode: data.country_code || "",
        currency: data.currency || "",
      };
    } catch (error) {
      console.error("Erro ao buscar localização por IP:", error);

      return {
        state: "",
        stateCode: "",
        city: "",
        continent: "",
        country: "",
        countryCode: "",
        currency: "",
      };
    }
  }
}
