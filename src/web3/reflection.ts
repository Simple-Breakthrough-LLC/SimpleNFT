import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { getPDA } from './utils.js';
import { serialize } from 'borsh';

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
export const REFLECTION_PROGRAM_ID = new PublicKey('CxA23eN7Dn524LFuJJ5FGLn3keE6o6XFxnWhrFuzbTCJ');

export const getReflectionTokenPDA = async (tokenMint : PublicKey) => getPDA(
	[
		tokenMint.toBuffer(),
	],
	REFLECTION_PROGRAM_ID
);

class CreateReflectionTokenArgs {
	instruction: number;
	supply: number;
	transferFeePercent: number;
	constructor(args: any) {
		this.instruction = 0;
		this.supply = args.supply;
		this.transferFeePercent = args.transferFeePercent;
	}
}

const REFLECTION_SCHEMA = new Map([
	[
		CreateReflectionTokenArgs,
		{
			kind: 'struct',
			fields: [
				['instruction', 'u16'],
				['supply', 'u64'],
				['transferFeePercent', 'u64'],
			]
		}
	],
]);

export const createNewReflectionTokenInstruction = async (
	mint: PublicKey,
	payer: PublicKey,
) => {
	const reflectionPDA = await getReflectionTokenPDA(mint);
	const args = new CreateReflectionTokenArgs({
		supply: 1000,
		transferFeePercent: 2,
	});
	const data = Buffer.from(
		serialize(
			REFLECTION_SCHEMA,
			args
		)
	);
	const keys = [
		{
			pubkey: SYSTEM_PROGRAM_ID,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: TOKEN_PROGRAM_ID,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: true,
			isSigner: true,
		},
		{
			pubkey: mint,
			isWritable: true,
			isSigner: true,
		},
		{
			pubkey: reflectionPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
	];
	return new TransactionInstruction({
		keys,
		programId: REFLECTION_PROGRAM_ID,
		data,
	});
}
