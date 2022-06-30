import {
	createAssociatedTokenAccountInstruction,
	createInitializeMintInstruction,
	createMintToInstruction,
	createTransferInstruction,
	MintLayout,
	TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { getPDA } from './utils.js';
import { PublicKey, SystemProgram } from '@solana/web3.js';

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

export const createMintInstructions = async (connection, payer, mint, decimals) => {
	return [
		SystemProgram.createAccount({
			fromPubkey: payer,
			newAccountPubkey: mint,
			space: MintLayout.span,
			lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
			programId: TOKEN_PROGRAM_ID,
		}),
		createInitializeMintInstruction(
			mint,
			decimals,
			payer,
			payer,
			TOKEN_PROGRAM_ID,
		)
	];
}

export const getAssociatedTokenAccountPDA = async (mint, wallet) => getPDA(
	[
		wallet.toBuffer(),
		TOKEN_PROGRAM_ID.toBuffer(),
		mint.toBuffer(),
	],
	SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
);

const getAndMaybeInitializeATA = async (connection, payer, mint, wallet) => {
	const ata = (await getAssociatedTokenAccountPDA(mint, wallet)).publicKey;
	const ataInfo = await connection.getParsedAccountInfo(ata);
	const instructions = (ataInfo.value)
		? []
		: [
			createAssociatedTokenAccountInstruction(
				payer,
				ata,
				wallet,
				mint,
			)
		]
	return { ata, instructions };
}

export const mintToInstructions = async (connection, payer, mint, amount, recipient) => {
	const { ata, instructions } = getAndMaybeInitializeATA(connection, payer, mint, recipient);
	instructions.push(
		createMintToInstruction(
			mint,
			ata,
			payer,
			amount,
		)
	);
	return instructions;
}

export const transferInstructions = async (connection, payer, mint, amount, recipient) => {
	const senderATA = getAssociatedTokenAccountPDA(mint, payer);
	const { ata, instructions } = getAndMaybeInitializeATA(connection, payer, mint, recipient);
	instructions.push(
		createTransferInstruction(
			senderATA,
			ata,
			payer,
			amount,
		)
	);
	return instructions;
}
