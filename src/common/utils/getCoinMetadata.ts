import { Metaplex } from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';

export async function getTokenMetadata(mintAdress: string) {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  const metaplex = Metaplex.make(connection);

  const mintAddress = new PublicKey(mintAdress);

  let tokenName;
  let tokenSymbol;
  let tokenLogo;
  let tokenDescription;

  const metadataAccount = metaplex.nfts().pdas().metadata({ mint: mintAddress });

  const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);

  if (metadataAccountInfo) {
    const token = await metaplex.nfts().findByMint({ mintAddress: mintAddress });
    tokenName = token.json?.name;
    tokenSymbol = token.json?.symbol;
    tokenDescription = token.json?.description;
    tokenLogo = token.json ? token.json.image : null;

    return { name: tokenName, symbol: tokenSymbol, logo: tokenLogo, description: tokenDescription };
  }
}
