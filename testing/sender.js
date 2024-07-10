const { ethers } = require('ethers');
const crypto = require('crypto');

// Set up the provider and wallet
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
const key = crypto.randomBytes(32).toString('hex'); // Store this securely
const iv = crypto.randomBytes(16).toString('hex');  // Store this securely

// Encrypt function
function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

// Concatenate and encrypt transaction details
const senderAddress = wallet.address;
const receiverAddress = '0x8A694a4cC8e0d2E27837305f1e55811f4628416D'; // Replace with actual receiver address
const amount = '1000';
const transactionDetails = `${senderAddress},${receiverAddress},${amount}`;
const encryptedTransactionDetails = encrypt(transactionDetails);

// ZKP hash function
function generateZKPHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

const zkpHash = generateZKPHash(transactionDetails);

console.log('Encryption Key:', key);
console.log('Initialization Vector:', iv);
console.log('Encrypted Transaction Details:', encryptedTransactionDetails);
console.log('ZKP Hash:', zkpHash);

// Store encrypted amount on blockchain
async function storeEncryptedAmount() {
  try {
    // Get the latest nonce for the account
    const nonce = await provider.getTransactionCount(wallet.address, 'latest');
    
    const tx = await contract.storeEncryptedAmount(
      ethers.getBytes('0x' + encryptedTransactionDetails),
      '0x' + zkpHash,
      { nonce: nonce } // Specify the nonce
    );
    await tx.wait();
    console.log('Transaction Hash:', tx.hash);

  } catch (error) {
    console.error('Error storing encrypted amount:', error);
  }
}


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


storeEncryptedAmount();
