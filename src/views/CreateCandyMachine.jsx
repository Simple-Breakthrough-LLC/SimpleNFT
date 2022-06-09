import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';
import {
	checkCandyData,
	createCandyMachineInstructions,
	setCollectionInstructions,
} from '../web3/utils.js';
const web3 = require('@solana/web3.js');

// TODO get this from metaplex
// const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const uuidFromConfigPubkey = configAccount => configAccount.toBase58().slice(0, 6);

export const CreateCandyMachine = () => {
	const { connection } = useConnection();
    const wallet = useWallet();

	const create = async () => {
		const payer = wallet.publicKey;
		const candyMachine = web3.Keypair.generate();
		const collectionMint = web3.Keypair.generate();
		// TODO Either generate the treasury wallet, or obtain from user
		const treasuryWallet = new web3.PublicKey('7DFRtmhGzEG61TVfL4LjhFe7toah7E9pQtLFX4KYa8vq');
		// let metadataPDA = await web3.PublicKey.findProgramAddress(
		// 	[
		// 		'metadata',
		// 		TOKEN_METADATA_PROGRAM_ID.toBuffer(),
		// 		collectionMint.publicKey.toBuffer()
		// 	],
		// 	TOKEN_PROGRAM_ID
		// );
		// metadataPDA = {
		// 	publicKey: metadataPDA[0],
		// 	bumpSeed: metadataPDA[1]
		// }
		// metadata account = 'metadata' + tokenMetadataPID + Mint
		// master edition account = 'metadata' + tokenMetadataPID + Mint + "edition"

		console.log('payer:', payer.toBase58())
		console.log('candy machine:', candyMachine.publicKey.toBase58())
		console.log('collection mint:', collectionMint.publicKey.toBase58())

		const candyData = {
			uuid: uuidFromConfigPubkey(candyMachine.publicKey), // shouldn't it be 110000 or 01H333 or something...?
			price: 0.1e9,
			symbol: "TEST",
			sellerFeeBasisPoints: 550, // 5.5%
			maxSupply: 1,
			isMutable: true,
			retainAuthority: true,
			goLiveDate: 1640390400,
			endSettings: null,
			creators: [
				{
					address: payer,
					verified: true,
					share: 100
				}
			],
			hiddenSettings: {
				name: "Test Token ",
				uri: "https://example.com/",
				hash: "80a7b27fb7c83f4178bbedc1e2a3a506", // TODO for later verification of token reveals
			},
			whitelistMintSettings: null,
			itemsAvailable: 1,
			gatekeeper: null,
		};
		const status = checkCandyData(candyData).err;
		if (status.err) {
			alert(status.err);
			return;
		}

		const initInstructions = await createCandyMachineInstructions(
			connection,
			{
				payer,
				candyMachine,
				treasuryWallet,
			},
			candyData,
		);
		const collectionInstructions = await setCollectionInstructions(
			connection,
			{
				payer,
				collectionMint,
			},
		);

		const instructions = [...collectionInstructions];// initInstructions
		const transaction = new web3.Transaction();
		transaction.add(...instructions);
		const signature = await wallet.sendTransaction(
			transaction,
			connection,
			{signers: [collectionMint]} // candyMachine
		);
		console.log('signature', signature);
		connection.onSignature(signature, (result, context) => {
			if (result.err)
				console.log('Transaction rejected.');
			else
				console.log('Transaction confirmed.');
		}, 'processed');
	}

	if (!wallet.connected) return <WalletDialogButton>Connect</WalletDialogButton>
	return <button onClick={create}>button</button>
}
