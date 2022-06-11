import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';
import {
	createCandyMachine,
} from '../web3/utils.js';

export const CreateCandyMachine = () => {
	const { connection } = useConnection();
    const wallet = useWallet();

	const create = async () => {
		const candyMachine = await createCandyMachine(wallet, connection, {
			price: 0.1e9,
			symbol: "TEST",
			maxSupply: 1,
			hiddenSettings: {
				name: "Test Token ",
				uri: "https://example.com/",
				hash: "80a7b27fb7c83f4178bbedc1e2a3a506", // TODO for later verification of token reveals
			},
		});
		if (candyMachine.err) {
			alert(candyMachine.err);
			return;
		}
		console.log('payer:', candyMachine.payer.toBase58())
		console.log('candy machine:', candyMachine.candyMachine.toBase58())
		console.log('collection mint:', candyMachine.collectionMint.toBase58())
		console.log('collection metadata:', candyMachine.collectionMetadata.toBase58())
		console.log('collection master edition:', candyMachine.collectionMasterEdition.toBase58())
		console.log('collection:', candyMachine.collection.toBase58())
		console.log('collection authority record:', candyMachine.collectionAuthorityRecord.toBase58())
	}

	if (!wallet.connected) return <WalletDialogButton>Connect</WalletDialogButton>
	return <button onClick={create}>button</button>
}
