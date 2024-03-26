import { findCoinByUserId } from '@/api/coin/coin.service';
import { BalanceModel } from '@/models/balance.model';
import { getSolBalance, getSolBalanceByCurrentPrice } from '@/services/solWalletService';

export const seedSolBalances = async () => {
  try {
    // Get the current date
    let currentDate = new Date('2024-03-26');
    const endDate = new Date('2024-03-06');
    const walletAddress = 'DDwKvwge3xGxVLrVhe9Zd5KZPMzt77Aqgn7KyQ6NX2Tq';
    const solData = await getSolBalance(walletAddress);

    const coins = await findCoinByUserId('6601e3aa89ba1f3fcb27da31');
    let solBalance = solData.sol;

    if (coins) {
      await Promise.all(
        coins.map(async (coin) => {
          if (coin) {
            const solBalanceByPrice = await getSolBalanceByCurrentPrice(coin.ca);
            if (solBalanceByPrice) {
              let solBalanceNew = solBalanceByPrice / 1000000;
              if (solBalanceByPrice !== undefined) {
                console.log('sol balance before:', solBalance);
                solBalance += solBalanceNew;
                console.log('sol balance after:', solBalance);
              }
            }
          }
        })
      );
    }

    // Calculate solPrice only if solData.solPrice is defined
    const solPrice = solData.solPrice;
    console.log('solPrice:', solPrice);
    if (solPrice !== undefined) {
      // Generate SOL balances for each day from 20 days ago to today
      while (currentDate >= endDate) {
        // Generate one SOL balance for the current day
        const balance = {
          walletAddress: 'DDwKvwge3xGxVLrVhe9Zd5KZPMzt77Aqgn7KyQ6NX2Tq', // Update with your wallet address
          solBalance: solBalance, // Random SOL balance between 1000 and 5000
          user: '6601e3aa89ba1f3fcb27da31', // Update with your user ID
          timestamp: currentDate,
          solPrice: solBalance * solPrice,
        };

        // Insert balance into MongoDB
        await BalanceModel.create(balance);

        // Move to the previous day
        currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Subtract one day in milliseconds
      }
    } else {
      console.error('Error seeding Sol balances: solPrice is undefined');
    }

    console.log('Sol balances seeded successfully.');
  } catch (error) {
    console.error('Error seeding Sol balances:', error);
  }
};
