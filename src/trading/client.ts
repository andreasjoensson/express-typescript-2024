import {
  AccountMeta,
  createJupiterApiClient,
  DefaultApi,
  Instruction,
  QuoteGetRequest,
  QuoteResponse,
  ResponseError,
} from '@jup-ag/api';
import {
  AddressLookupTableAccount,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import axios from 'axios';
import * as bs58 from 'bs58';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { getTokenMetadata } from '../common/utils/getCoinMetadata';
import CoinModel, { ICoin } from '../models/coin.model';
import TransactionModel from '../models/transaction.model';
import { fetchTransactions } from './sol';
config();

interface LogSwapArgs {
  inputToken: string;
  inAmount: string;
  outputToken: string;
  outAmount: string;
  txId: string;
  timestamp: string;
}

interface ArbBotConfig {
  solanaEndpoint: string; // e.g., "https://ex-am-ple.solana-mainnet.quiknode.pro/123456/"
  metisEndpoint: string; // e.g., "https://jupiter-swap-api.quiknode.pro/123456/"
  secretKey: string;
  firstTradePrice: number; // e.g. 94 USDC/SOL
  targetGainPercentage?: number;
  checkInterval?: number;
  initialInputToken: SwapToken;
  initialInputAmount: number;
}

interface NextTrade extends QuoteGetRequest {
  nextTradeThreshold?: number;
}

export enum SwapToken {
  SOL,
  USDC,
}

export class ArbBot {
  private solanaConnection: Connection;
  private jupiterApi: DefaultApi;
  private wallet: Keypair;
  private solMint: PublicKey = new PublicKey('So11111111111111111111111111111111111111112');
  private solBalance: number = 0;
  private usdcBalance: number = 0;
  private checkInterval: number = 1000 * 10;
  private priceWatchIntervalId?: NodeJS.Timeout;
  private nextTrade: NextTrade;
  private waitingForConfirmation: boolean = false;

  constructor(config: ArbBotConfig) {
    const { solanaEndpoint, metisEndpoint, secretKey, checkInterval, initialInputAmount } = config;
    this.solanaConnection = new Connection(solanaEndpoint);
    this.jupiterApi = createJupiterApiClient({ basePath: metisEndpoint });
    this.wallet = Keypair.fromSecretKey(bs58.decode(secretKey as any as string));
    if (checkInterval) {
      this.checkInterval = checkInterval;
    }
    this.nextTrade = {
      inputMint: this.solMint.toBase58(),
      outputMint: 'A6RhCooea83Aj65fpWLjE8Xaxfb7QToXCKuCqZe4Lf8h',
      amount: initialInputAmount,
    };
  }

  async init(): Promise<void> {
    console.log(`🤖 Initiating arb bot for wallet: ${this.wallet.publicKey.toBase58()}.`);
    await this.refreshBalances();
    console.log(`🏦 Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${this.usdcBalance}`);
    this.initiatePriceWatch();
  }

  private initiatePriceWatch(): void {
    this.priceWatchIntervalId = setInterval(async () => {
      try {
        if (this.waitingForConfirmation) {
          console.log('Waiting for previous transaction to confirm...');
          return;
        }
        const token = await fetchTransactions('HcAojADt7PGqUXMdAZuWagwru8BkNxN1HNG9jJsp2mT9');

        console.log('Token:', token);
        if (token) {
          this.nextTrade.outputMint = 'A6RhCooea83Aj65fpWLjE8Xaxfb7QToXCKuCqZe4Lf8h';
          const quote = await this.getQuote(this.nextTrade);
          this.evaluateQuoteAndSwap(quote);
        }
      } catch (error) {
        console.error('Error getting quote:', error);
      }
    }, this.checkInterval);
  }

  private async getQuote(quoteRequest: QuoteGetRequest): Promise<QuoteResponse> {
    try {
      const quote: QuoteResponse | null = await this.jupiterApi.quoteGet(quoteRequest);
      if (!quote) {
        throw new Error('No quote found');
      }
      return quote;
    } catch (error) {
      if (error instanceof ResponseError) {
        console.log(await error.response.json());
      } else {
        console.error(error);
      }
      throw new Error('Unable to find quote');
    }
  }

  private async evaluateQuoteAndSwap(quote: QuoteResponse): Promise<void> {
    try {
      this.waitingForConfirmation = true;
      await this.executeSwap(quote);
    } catch (error) {
      console.error('Error executing swap:', error);
    }
  }

  private async executeSwap(route: QuoteResponse): Promise<void> {
    try {
      const {
        computeBudgetInstructions,
        setupInstructions,
        swapInstruction,
        cleanupInstruction,
        addressLookupTableAddresses,
      } = await this.jupiterApi.swapInstructionsPost({
        swapRequest: {
          quoteResponse: route,
          userPublicKey: this.wallet.publicKey.toBase58(),
          prioritizationFeeLamports: 'auto',
        },
      });

      const instructions: TransactionInstruction[] = [
        ...computeBudgetInstructions.map(this.instructionDataToTransactionInstruction),
        ...setupInstructions.map(this.instructionDataToTransactionInstruction),
        this.instructionDataToTransactionInstruction(swapInstruction),
        this.instructionDataToTransactionInstruction(cleanupInstruction),
      ].filter((ix) => ix !== null) as TransactionInstruction[];

      const addressLookupTableAccounts = await this.getAdressLookupTableAccounts(
        addressLookupTableAddresses,
        this.solanaConnection
      );

      const { blockhash, lastValidBlockHeight } = await this.solanaConnection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: this.wallet.publicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message(addressLookupTableAccounts);

      const transaction = new VersionedTransaction(messageV0);
      transaction.sign([this.wallet]);

      const rawTransaction = transaction.serialize();
      const txid = await this.solanaConnection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 3,
      });
      const confirmation = await this.solanaConnection.confirmTransaction(
        { signature: txid, blockhash, lastValidBlockHeight },
        'confirmed'
      );
      if (confirmation.value.err) {
        console.log('Transaction failed:', confirmation.value.err);
        throw new Error('Transaction failed');
      }
      await this.postTransactionProcessing(route, txid);
    } catch (error) {
      if (error instanceof ResponseError) {
        console.log(await error.response.json());
      } else {
        console.error(error);
      }
      throw new Error('Unable to execute swap');
    } finally {
      this.waitingForConfirmation = false;
    }
  }

  private async refreshBalances(): Promise<void> {
    try {
      const results = await Promise.allSettled([this.solanaConnection.getBalance(this.wallet.publicKey)]);

      const solBalanceResult = results[0];

      if (solBalanceResult.status === 'fulfilled') {
        this.solBalance = solBalanceResult.value;
      } else {
        console.error('Error fetching SOL balance:', solBalanceResult.reason);
      }

      if (this.solBalance < LAMPORTS_PER_SOL / 100) {
        this.terminateSession('Low SOL balance.');
      }
    } catch (error) {
      console.error('Unexpected error during balance refresh:', error);
    }
  }

  private async logSwap(args: LogSwapArgs): Promise<void> {
    const { inputToken, inAmount, outputToken, outAmount, txId, timestamp } = args;
    const logEntry = {
      inputToken,
      inAmount,
      outputToken,
      outAmount,
      txId,
      timestamp,
    };

    const token = await getTokenMetadata(outputToken);

    // Check if the output coin already exists
    let coin: ICoin | null = await CoinModel.findOne({ ca: outputToken });

    if (coin) {
      const parsedOutAmount = parseFloat(outAmount);
      coin.amount += parsedOutAmount;
      await coin.save();
    }

    // If the coin doesn't exist, create a new one
    if (!coin) {
      coin = await CoinModel.create({
        ca: outputToken,
        name: token?.name,
        image: token?.logo,
        user: '6601e3aa89ba1f3fcb27da31',
        description: token?.description,
        symbol: token?.symbol,
        amount: outAmount,
      });
    }

    const currentPrice = await this.getTokenPrice(outputToken);
    // Create a new transaction
    await TransactionModel.create({
      transactionId: txId,
      date: timestamp,
      buyPrice: currentPrice,
      user: '6601e3aa89ba1f3fcb27da31',
      coin: coin._id,
      buyAmount: inAmount,
      amount: outAmount,
      status: 'COMPLETED',
      type: 'buy',
    });

    const filePath = path.join(__dirname, 'trades.json');

    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([logEntry], null, 2), 'utf-8');
      } else {
        const data = fs.readFileSync(filePath, { encoding: 'utf-8' });
        const trades = JSON.parse(data);
        trades.push(logEntry);
        fs.writeFileSync(filePath, JSON.stringify(trades, null, 2), 'utf-8');
      }
      console.log(`✅ Logged swap: ${inAmount} ${inputToken} -> ${outAmount} ${outputToken},\n  TX: ${txId}}`);
    } catch (error) {
      console.error('Error logging swap:', error);
    }
  }

  private terminateSession(reason: string): void {
    console.warn(`❌ Terminating bot...${reason}`);
    console.log(`Current balances:\nSOL: ${this.solBalance / LAMPORTS_PER_SOL},\nUSDC: ${this.usdcBalance}`);
    if (this.priceWatchIntervalId) {
      clearInterval(this.priceWatchIntervalId);
      this.priceWatchIntervalId = undefined; // Clear the reference to the interval
    }
    setTimeout(() => {
      console.log('Bot has been terminated.');
      process.exit(1);
    }, 1000);
  }

  private instructionDataToTransactionInstruction(instruction: Instruction | undefined) {
    if (instruction === null || instruction === undefined) return null;
    return new TransactionInstruction({
      programId: new PublicKey(instruction.programId),
      keys: instruction.accounts.map((key: AccountMeta) => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(instruction.data, 'base64'),
    });
  }

  private async getAdressLookupTableAccounts(
    keys: string[],
    connection: Connection
  ): Promise<AddressLookupTableAccount[]> {
    const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
      keys.map((key) => new PublicKey(key))
    );

    return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
      const addressLookupTableAddress = keys[index];
      if (accountInfo) {
        const addressLookupTableAccount = new AddressLookupTableAccount({
          key: new PublicKey(addressLookupTableAddress),
          state: AddressLookupTableAccount.deserialize(accountInfo.data),
        });
        acc.push(addressLookupTableAccount);
      }

      return acc;
    }, new Array<AddressLookupTableAccount>());
  }

  private async getTokenPrice(tokenId: string): Promise<number | undefined> {
    try {
      const response = await axios.get(`https://price.jup.ag/v4/price?ids=${tokenId}`);
      console.log('response:', response.data);
      const price = response.data.data[tokenId]?.price;
      if (price !== undefined) {
        return price;
      } else {
        return undefined;
      }
    } catch (error) {
      console.error('Error fetching token price:', error);
      return undefined;
    }
  }

  private async postTransactionProcessing(quote: QuoteResponse, txid: string): Promise<void> {
    const { inputMint, inAmount, outputMint, outAmount } = quote;

    await this.refreshBalances();
    await this.logSwap({
      inputToken: inputMint,
      inAmount,
      outputToken: outputMint,
      outAmount,
      txId: txid,
      timestamp: new Date().toISOString(),
    });
  }
}
