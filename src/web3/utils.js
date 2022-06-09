import {
	MintLayout,
	TOKEN_PROGRAM_ID,
	createInitializeMintInstruction,
	createAssociatedTokenAccountInstruction,
	createMintToInstruction,
	getAssociatedTokenAddress,
} from '@solana/spl-token';
import {
	createInitializeCandyMachineInstruction,
	PROGRAM_ID as CANDY_MACHINE_PROGRAM_V2_ID
} from '@metaplex-foundation/mpl-candy-machine';
import {
	CONFIG_ARRAY_START_V2,
	CONFIG_LINE_SIZE_V2,
} from './constants.js';
const web3 = require('@solana/web3.js');

export const checkCandyData = (candyData) => {
	if (!candyData.symbol)
		return {err: "Symbol cannot be empty."}
	if (candyData.symbol.length > 10)
		return {err: "Max symbol length is 10 characters."}
	if (candyData.hiddenSettings.name) {
		const maxName = candyData.hiddenSettings.name + "#" + candyData.maxSupply;
		if (maxName.length > 32)
			return {err: "Some token names would exceed 32 characters."}
	}
	if (candyData.hiddenSettings) {
		if (!candyData.hiddenSettings.name)
			return {err: "Name cannot be empty."}
		if (!candyData.hiddenSettings.uri)
			return {err: "URI cannot be empty."}
		if (!candyData.hiddenSettings.hash)
			return {err: "Verification hash cannot be empty."}
		if (candyData.hiddenSettings.hash.length != 32)
			return {err: "Verification hash must be 32 bytes."}
	}
	if (!candyData.creators || candyData.creators.length == 0)
		return {err: "Need at least one creator."}
	for (const creator of candyData.creators) {
		if (!creator.address)
			return {err: "Creator is missing address."}
		if (!creator.verified)
			return {err: "Creator is missing verified."}
		if (!creator.share)
			return {err: "Creator is missing share."}
	}
	if (candyData.creators.length > 4)
		return {err: "Maximum of 4 creators."}
	if (candyData.creators.reduce((acc, curr) => acc + curr.share, 0) != 100)
		return {err: "Creator shares should add up to 100."}
	return {err: false}
}

export const candyAccountSize = (itemsAvailable) => {
	itemsAvailable = Number(itemsAvailable);
	return (
		CONFIG_ARRAY_START_V2 +
		4 +
		itemsAvailable * CONFIG_LINE_SIZE_V2 +
		8 +
		2 * (Math.floor(itemsAvailable / 8) + 1)
	);
}

export const createCandyMachineInstructions = async (connection, accounts, candyData) => {
	const { payer, candyMachine, treasuryWallet } = accounts;
	const candyMachineSize = candyAccountSize(candyData.itemsAvailable);
	return [
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
}

export const setCollectionInstructions = async (connection, accounts) => {
	const { payer, collectionMint } = accounts;
	const associatedTokenAccount = await getAssociatedTokenAddress(
		collectionMint.publicKey,
		payer
	);
	return [
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
}
