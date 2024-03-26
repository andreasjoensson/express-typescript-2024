import axios from 'axios';
import env from 'dotenv';

env.config();

type PriceStats = {
  priceChange: number;
  marketcap: number;
  price: number;
  volume: number;
};

export async function getPriceStats(tokenId: string): Promise<PriceStats | undefined> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenId}`);
    const stats = response.data.pairs;
    if (stats !== undefined) {
      const pair = stats[0];
      return { priceChange: pair.priceChange.h24, price: pair.priceUsd, marketcap: pair.fdv, volume: pair.volume.h24 };
    } else {
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    return undefined;
  }
}

export async function fetchHistoryPrice(startDate: string, token: string): Promise<number> {
  try {
    // Convert start date string to a Date object
    const startDateObj = new Date(startDate);

    // Calculate duration in seconds (24 hours)
    const durationSeconds = 24 * 60 * 60;

    // Calculate the "to" Unix timestamp
    const endDateObj = new Date(startDateObj.getTime() + durationSeconds * 1000);

    // Convert start and end dates to Unix timestamps
    const startTimeStamp = Math.floor(startDateObj.getTime() / 1000);
    const endTimeStamp = Math.floor(endDateObj.getTime() / 1000);

    // API request options
    const options = {
      method: 'GET',
      url: 'https://public-api.birdeye.so/public/history_price',
      params: {
        address: token,
        address_type: 'token',
        time_from: startTimeStamp.toString(),
        time_to: endTimeStamp.toString(),
      },
      headers: { 'X-API-KEY': process.env.BIRDEYE_API_KEY },
    };

    // Making the API request
    const response = await axios.request(options);
    console.log(response.data);
    const price = response.data.data.items[0].value;
    return price;
  } catch (error) {
    console.error(error);
  }
  return 0;
}
