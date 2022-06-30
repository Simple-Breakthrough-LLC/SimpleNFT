const web3 = require('@solana/web3.js');
const nacl = require('tweetnacl');

export const getPDA = async (seeds, programId) => {
	const pda = await web3.PublicKey.findProgramAddress(
		seeds,
		programId
	);
	return {
		publicKey: pda[0],
		bumpSeed: pda[1]
	};
}

export const sendAndConfirmInstructions = (
	wallet,
	connection,
	instructions,
	signers=[],
	commitment='processed'
) => new Promise(async (resolve, reject) => {
	const transaction = new web3.Transaction();
	transaction.add(...instructions);
	const signature = await wallet.sendTransaction(
		transaction,
		connection,
		{signers}
	);
	connection.onSignature(signature, (result, context) => {
		if (result.err)
			reject({signature, result, context});
		else
			resolve({signature, result, context});
	}, commitment);
})
