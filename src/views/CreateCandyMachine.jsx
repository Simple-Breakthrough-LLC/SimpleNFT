import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';
import {
	checkCandyData,
	createCandyMachineInstructions,
	setCollectionInstructions,
	getMetadataPDA,
	getMasterEditionPDA,
	getCollectionPDA,
	getCollectionAuthorityRecordPDA,
} from '../web3/utils.js';
const web3 = require('@solana/web3.js');

const uuidFromConfigPubkey = configAccount => configAccount.toBase58().slice(0, 6);

export const CreateCandyMachine = () => {
	const { connection } = useConnection();
    const wallet = useWallet();

	const create = async () => {
		const payer = wallet.publicKey;
		const candyMachine = web3.Keypair.generate();
		const collectionMint = web3.Keypair.generate();
		const metadataPDA = await getMetadataPDA(collectionMint.publicKey);
		const masterEditionPDA = await getMasterEditionPDA(collectionMint.publicKey);
		const collectionPDA = await getCollectionPDA(candyMachine.publicKey);
		const collectionAuthorityRecord = await getCollectionAuthorityRecordPDA(collectionMint.publicKey, collectionPDA.publicKey);
		// TODO Either generate the treasury wallet, or obtain from user
		// Actually... if we're charging in SOL, it should probably just be the user wallet
		const treasuryWallet = new web3.PublicKey('7DFRtmhGzEG61TVfL4LjhFe7toah7E9pQtLFX4KYa8vq');

		console.log('payer:', payer.toBase58())
		console.log('candy machine:', candyMachine.publicKey.toBase58())
		console.log('collection mint:', collectionMint.publicKey.toBase58())
		console.log('collection metadata:', metadataPDA.publicKey.toBase58())
		console.log('collection master edition:', masterEditionPDA.publicKey.toBase58())
		console.log('collection:', collectionPDA.publicKey.toBase58())
		console.log('collection authority record:', collectionAuthorityRecord.publicKey.toBase58())

		const candyData = {
			uuid: uuidFromConfigPubkey(candyMachine.publicKey),
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
				candyMachine,
			},
			candyData,
		);

		{
			const transaction = new web3.Transaction();
			transaction.add(...initInstructions);
			const signature = await wallet.sendTransaction(
				transaction,
				connection,
				{signers: [candyMachine]}
			);
			console.log('signature', signature);
			connection.onSignature(signature, (result, context) => {
				if (result.err)
					console.log('Transaction rejected.');
				else
					console.log('Transaction confirmed.');
			}, 'processed');
		}

		{
			const transaction = new web3.Transaction();
			transaction.add(...collectionInstructions);
			const signature = await wallet.sendTransaction(
				transaction,
				connection,
				{signers: [collectionMint]}
			);
			console.log('signature', signature);
			connection.onSignature(signature, (result, context) => {
				if (result.err)
					console.log('Transaction rejected.');
				else
					console.log('Transaction confirmed.');
			}, 'processed');
		}
	}

	if (!wallet.connected) return <WalletDialogButton>Connect</WalletDialogButton>
	return <button onClick={create}>button</button>
}
