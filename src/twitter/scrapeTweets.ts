import axios from 'axios';
import cron from 'node-cron';
import { Client } from 'twitter-api-sdk';

const client = new Client(process.env.BEARER_TOKEN as string);

interface SolanaResponse {
  solanaAddress: string;
}

async function getBuySentiment(tweet: string): Promise<string | null> {
  try {
    const response = await axios.post<any>(
      'https://chatbotai-dk.openai.azure.com/openai/deployments/ChatbotAI/chat/completions?api-version=2023-07-01-preview',
      {
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant, which should help me find Solana addresses by provided text input. The text may contain a Solana address, often preceded by "ca".

              Your task is to extract the Solana address from the provided text.
              
              Return the Solana address as JSON in the following format:
              {
                  "solanaAddress": "A6RhCooea83Aj65fpWLjE8Xaxfb7QToXCKuCqZe4Lf8h"
              }
              
              Example Input:
              
              Text: "Please transfer funds to caA6RhCooea83Aj65fpWLjE8Xaxfb7QToXCKuCqZe4Lf8h for processing."
              
              Example Output:
              
              json
              
              {
                  "solanaAddress": "A6RhCooea83Aj65fpWLjE8Xaxfb7QToXCKuCqZe4Lf8h"
              }
              `,
          },
          {
            role: 'user',
            content: tweet,
          },
        ],
        temperature: 0.2,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_tokens: 800,
        stop: null,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        },
      }
    );

    const solanaJsonString = response.data.choices[0]?.message.content.trim();
    const solanaObject: SolanaResponse = JSON.parse(solanaJsonString);
    const solanaAddress = solanaObject.solanaAddress;
    return solanaAddress;
  } catch (error) {
    console.error('Error making OpenAI API request:', error);
    return null;
  }
}

const analyzeTweet = async (tweet: any) => {
  try {
    const solanaCA = await getBuySentiment(tweet.text);
    console.log(`Sentiment for tweet:`, solanaCA);
  } catch (error) {
    console.error('Error analyzing tweet:', error);
  }
};

// Function to fetch tweets for multiple users
const fetchTweets = async (usernames: string[]) => {
  try {
    for (const username of usernames) {
      const { data } = await client.users.findUserByUsername(username);
      if (!data) throw new Error(`Couldn't find user: ${username}`);

      const tweets = await client.tweets.usersIdTweets(data.id, {
        max_results: 5,
      });

      for (const tweet of tweets.data || []) {
        const tweetCreatedAt = new Date(tweet.created_at as string);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - tweetCreatedAt.getTime();
        const minutesDifference = Math.floor(timeDifference / (1000 * 60));

        if (minutesDifference <= 30) {
          await analyzeTweet(tweet);
        }
      }

      console.log(`Fetched tweets for ${username}:`, tweets);
    }
  } catch (error) {
    console.error('Error fetching tweets:', error);
  }
};

// Array of usernames to fetch tweets for
const usernames = ['TheMisterFrog', 'andreasmorenoo'];

// Calculate number of requests per hour
const requestsPerHourPerUsername = Math.ceil(1666.67 / (30 * 24));

// Schedule requests every hour
cron.schedule(`0 */${requestsPerHourPerUsername} * * *`, async () => {
  console.log(`Fetching tweets (${requestsPerHourPerUsername} requests/hour)...`);
  await fetchTweets(usernames);
});
