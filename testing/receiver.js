const { ethers } = require('ethers');
const crypto = require('crypto');
const { Wallet } = require('ethers');


// Set up the provider
const provider = new ethers.JsonRpcProvider('https://eth-sepolia.g.alchemy.com/v2/ieKltUTO99WB-tFYz6IlH6odf_t8pei5');
const privateKey = '6a9e9bb1f9cc6ae80a7bb6d89c88ccf85dccf7c7ac41a3863a35ca7adba90170';
const wallet = new ethers.Wallet(privateKey, provider);

// Contract address and ABI
const contractAddress = '0xfc83966CA1bE133588d339F3fe603EE3aa99a4D2';
const abi = [
	{
		"inputs": [
			{
				"internalType": "bytes",
				"name": "encryptedAmount",
				"type": "bytes"
			},
			{
				"internalType": "bytes32",
				"name": "zkpHash",
				"type": "bytes32"
			}
		],
		"name": "storeEncryptedAmount",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getEncryptedAmount",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			},
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contract = new ethers.Contract(contractAddress, abi, wallet);

// AES encryption setup
const algorithm = 'aes-256-cbc';

// Decrypt function
function decrypt(encryptedData, key, iv) {
  try {
    let ivBuffer = Buffer.from(iv, 'hex');
    let encryptedText = Buffer.from(encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), ivBuffer);

    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption Error:', error);
    throw new Error('Decryption failed. Check key, IV, or data integrity.');
  }
}

// ZKP hash function
function generateZKPHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Retrieve and log the stored encrypted amount
async function getStoredEncryptedAmount() {
  try {
    const [storedEncryptedAmountBytes, storedZKPHash] = await contract.getEncryptedAmount();
    const storedEncryptedAmountHex = ethers.hexlify(storedEncryptedAmountBytes);

    if (storedEncryptedAmountHex === '0x') {
      console.log('No encrypted amount stored for this address.');
      return;
    }

    // Decrypt and log the decrypted amount
    // Note: Replace 'key' and 'iv' with the actual values used during encryption
    const key = '4c38887220d75a133d4c413a62085919478a20ecd21ed2010de65e3619d10980'; // Replace with the actual encryption key
    const iv = 'd94e771a8928499573b5f97923df2373'; // Replace with the actual IV

    const decryptedAmount = decrypt(storedEncryptedAmountHex.slice(2), key, iv); // Remove '0x' prefix

    // Split the decrypted string into its components
    const [decryptedSenderAddress, decryptedReceiverAddress, decryptedAmountValue] = decryptedAmount.split(',');

    const calculatedZKPHash = generateZKPHash(decryptedAmount);
    const isZKPValid = calculatedZKPHash === storedZKPHash.slice(2);

    console.log('Decrypted Sender Address:', decryptedSenderAddress);
    console.log('Decrypted Receiver Address:', decryptedReceiverAddress);
    console.log('Decrypted Amount:', decryptedAmountValue);
    console.log('Is ZKP Valid:', isZKPValid);


  } catch (error) {
    console.error('Error retrieving stored encrypted amount:', error);
  }
}

getStoredEncryptedAmount();
