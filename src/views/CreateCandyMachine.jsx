import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';
import {
	MintLayout,
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createInitializeMintInstruction,
	createAssociatedTokenAccountInstruction,
	createMintToInstruction,
	getAssociatedTokenAddress
} from '@solana/spl-token';
import {
	createInitializeCandyMachineInstruction,
	PROGRAM_ID as CANDY_MACHINE_PROGRAM_V2_ID
} from '@metaplex-foundation/mpl-candy-machine';
import {
	candyAccountSize
} from '../web3/utils.js';
const web3 = require('@solana/web3.js');

// TODO get this from metaplex
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const uuidFromConfigPubkey = configAccount => configAccount.toBase58().slice(0, 6);

export const CreateCandyMachine = () => {
	const { connection } = useConnection();
    const wallet = useWallet();

	const create = async () => {
		const payer = wallet.publicKey;
		const candyMachine = web3.Keypair.generate();
		const collectionMint = web3.Keypair.generate();
		const associatedTokenAccount = await getAssociatedTokenAddress(
			collectionMint.publicKey,
			payer
		);
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
		console.log('associated token account:', associatedTokenAccount.toBase58())

		const candyData = {
			uuid: uuidFromConfigPubkey(candyMachine.publicKey), // shouldn't it be 110000 or 01H333 or 94coJY or something...?
			price: 0.1e9,
			symbol: "TEST", // TODO limit is 10 bytes
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
				name: "Test Token ", // with number added, can be no more than 32 bytes
				uri: "https://example.com/",
				hash: "80a7b27fb7c83f4178bbedc1e2a3a506", // for later verification of token reveals (32 chars)
			},
			whitelistMintSettings: null,
			itemsAvailable: 1,
			gatekeeper: null,
		};
		const candyMachineSize = candyAccountSize(candyData.itemsAvailable);
		const initInstructions = [
			web3.SystemProgram.createAccount({
				fromPubkey: payer,
				newAccountPubkey: candyMachine.publicKey,
				space: candyMachineSize,
				lamports: await connection.getMinimumBalanceForRentExemption(candyMachineSize),
				programId: CANDY_MACHINE_PROGRAM_V2_ID,
			}),
			createInitializeCandyMachineInstruction(
				{
					candyMachine: candyMachine.publicKey,
					wallet: treasuryWallet,
					authority: payer,
					payer
				},
				{
					data: candyData
				}
			),
		];

		const setCollectionInstructions = [
			web3.SystemProgram.createAccount({
				fromPubkey: payer,
				newAccountPubkey: collectionMint.publicKey,
				space: MintLayout.span,
				lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
				programId: TOKEN_PROGRAM_ID,
			}),
			createInitializeMintInstruction(
				collectionMint.publicKey,
				0,
				payer,
				payer,
				TOKEN_PROGRAM_ID,
			),
			createAssociatedTokenAccountInstruction(
				payer,
				associatedTokenAccount,
				payer,
				collectionMint.publicKey,
			),
			createMintToInstruction(
				collectionMint.publicKey,
				associatedTokenAccount,
				payer,
				1,
				[],
				TOKEN_PROGRAM_ID,
			),
			// Token Metadata Program: Create Metadata Accounts v2 (collection metadata, collection mint, owner, owner, owner)
			// Token Metadata Program: V3 Create Master Edition (collection master edition, collection mint, owner * 3, collection metadata)
			// Candy Machine: Set Collection (candy machine, owner, collection PDA, owner, collection metadata, collection mint, collection master edition, collection authority record)
		];

		const instructions = [...initInstructions]//, ...setCollectionInstructions];
		const transaction = new web3.Transaction();
		transaction.add(...instructions);
		console.log(instructions)
		console.log(instructions[1].programId.toBase58())
		// const signature = await wallet.sendTransaction(transaction, connection);
		const signature = await wallet.sendTransaction(
			transaction,
			connection,
			{signers: [candyMachine]} // collectionMint
		);
		// const signature = await web3.sendAndConfirmTransaction(
		// 	connection,
		// 	transaction,
		// 	[candyMachine],
		// );
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
