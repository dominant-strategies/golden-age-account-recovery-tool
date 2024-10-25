const quais = require("quais");

function printAddressTable(addresses) {
  if (addresses.length === 0) {
    console.log("No addresses found");
    return;
  }
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
    const wallet = quais.QiHDWallet.fromMnemonic(mnemonic);
    const provider = new quais.JsonRpcProvider(
      "https://rpc.quai.network",
      undefined,
      { usePathing: true }
    );
    const limit = 100;

    const balancePromises = [];
    const addresses = [];
    // check balance of first 100 addresses
    for (let i = 0; i < limit; i++) {
      const address = await wallet.getNextAddress(0, quais.Zone.Cyprus1);
      addresses.push(address);
      balancePromises.push(provider.getBalance(address.address));
    }

    const balances = await Promise.all(balancePromises);
    const hasBalance = [];

    for (let i = 0; i < balances.length; i++) {
      if (balances[i] > 0) {
        hasBalance.push(addresses[i]);
      }
    }

    const addressInfo = hasBalance.map((addressInfo) => {
      const privateKey = wallet.getPrivateKey(addressInfo.address);
      return { ...addressInfo, privateKey };
    });
    printAddressTable(addressInfo);
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
