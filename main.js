const quais = require("quais");

function printAddressTable(addresses, coin) {
  if (addresses.length === 0) {
    console.log(`No ${coin} addresses found`);
    return;
  }
  console.log(`\n${coin} addresses with balance:`);
  const addressTable = addresses.map((addr) => ({
    PubKey: addr.pubKey,
    Address: addr.address,
    PrivateKey: addr.privateKey,
    Index: addr.index,
    Change: addr.change ? "Yes" : "No",
    Zone: addr.zone,
  }));
  console.table(addressTable);
}

async function main() {
  // Check if a public key is provided as a command line argument
  if (process.argv.length < 3) {
    console.error("Please provide seed phrase as a command line argument");
    process.exit(1);
  }

  let seedPhrase = process.argv[2].trim();

  // Verify if the provided string has 12 or 24 words
  const seedPhraseWords = seedPhrase.split(" ");
  if (seedPhraseWords.length !== 12 && seedPhraseWords.length !== 24) {
    process.exit(1);
  }

  try {
    // Compute the address from the public key
    const mnemonic = quais.Mnemonic.fromPhrase(seedPhrase);
    const qiWallet = quais.QiHDWallet.fromMnemonic(mnemonic);
    const quaiWallet = quais.QuaiHDWallet.fromMnemonic(mnemonic);
    const provider = new quais.JsonRpcProvider(
      "https://rpc.quai.network",
      undefined,
      { usePathing: true }
    );
    const limit = 100;

    const qiBalancePromises = [];
    const quaiBalancePromises = [];
    const qiAddresses = [];
    const quaiAddresses = [];
    // check balance of first 100 addresses
    for (let i = 0; i < limit; i++) {
      const qiAddress = await qiWallet.getNextAddress(0, quais.Zone.Cyprus1);
      const quaiAddress = await quaiWallet.getNextAddress(
        0,
        quais.Zone.Cyprus1
      );
      qiAddresses.push(qiAddress);
      quaiAddresses.push(quaiAddress);
      qiBalancePromises.push(provider.getBalance(qiAddress.address));
      quaiBalancePromises.push(provider.getBalance(quaiAddress.address));
    }

    const qiBalances = await Promise.all(qiBalancePromises);
    const quaiBalances = await Promise.all(quaiBalancePromises);

    const qiHasBalance = [];
    const quaiHasBalance = [];

    for (let i = 0; i < qiBalances.length; i++) {
      if (qiBalances[i] > 0) {
        qiHasBalance.push(qiAddresses[i]);
      }
      if (quaiBalances[i] > 0) {
        quaiHasBalance.push(quaiAddresses[i]);
      }
    }

    const qiAddressInfo = qiHasBalance.map((addressInfo) => {
      const privateKey = qiWallet.getPrivateKey(addressInfo.address);
      return { ...addressInfo, privateKey };
    });

    printAddressTable(qiAddressInfo, "Qi");

    const quaiAddressInfo = quaiHasBalance.map((addressInfo) => {
      const privateKey = quaiWallet.getPrivateKey(addressInfo.address);
      return { ...addressInfo, privateKey };
    });
    printAddressTable(quaiAddressInfo, "Quai");
  } catch (error) {
    console.error("Error computing address:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
