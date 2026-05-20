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
      const apiKey = process.env.IP_GEOLOCATION_KEY;

      const { data } = await axios.get(`https://api.ipgeolocation.io/ipgeo`, {
        params: {
          apiKey,
          ip,
        },
      });

      console.log(`Localização por IP: ${JSON.stringify(data)}`);

      return {
        state: data.state_prov || "",
        stateCode: this.getStateCode(data.state_code || ""),
        city: data.city || "",
        continent: data.continent_name || "",
        country: data.country_name || "",
        countryCode: data.country_code2 || "",
        currency: data.currency.code || "",
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

  private getStateCode(stateCode: string): string {
    if (!stateCode) {
      return "";
    }

    const splitStateCode = stateCode.split("-");

    return splitStateCode[1] || splitStateCode[0] || "";
  }
}
