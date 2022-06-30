import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { getPDA, sendAndConfirmInstructions } from './utils.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { serialize } from 'borsh';
// We need to strategically avoid certain files in the spl governance library because of this issue:
//   https://github.com/facebook/create-react-app/pull/12021
import { getGovernanceSchema } from '@solana/spl-governance/lib/governance/serialisation';
import { GovernanceConfig, MintMaxVoteWeightSource, RealmConfigArgs, VoteThresholdPercentage } from '@solana/spl-governance/lib/governance/accounts';
import { CreateMintGovernanceArgs, CreateNativeTreasuryArgs, CreateRealmArgs } from '@solana/spl-governance/lib/governance/instructions';
import { createMintInstructions, mintToInstructions } from './token.js';

const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
const GOVERNANCE_PROGRAM_ID = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
const GOVERNANCE_PROGRAM_VERSION = 2;

export const getCommunityTokenHoldingPDA = async (realm: PublicKey, communityMint: PublicKey, programId: PublicKey) => getPDA(
	[
		'governance',
		realm.toBuffer(),
		communityMint.toBuffer(),
	],
	programId
);

export const getRealmPDA = async (name: string, programId: PublicKey) => getPDA(
	[
		'governance',
		new TextEncoder().encode(name),
	],
	programId
);

export const getGovernancePDA = async (realm: PublicKey, governedProgramId: PublicKey) => getPDA(
	[
		'program-governance',
		realm.toBuffer(),
		governedProgramId.toBuffer(),
	],
	governedProgramId
);

export const getMintGovernancePDA = async (realm: PublicKey, mint: PublicKey, programId: PublicKey) => getPDA(
	[
		'mint-governance',
		realm.toBuffer(),
		mint.toBuffer(),
	],
	programId
);

export const getTokenOwnerRecordPDA = async (realm: PublicKey, mint: PublicKey, tokenOwner: PublicKey, programId: PublicKey) => getPDA(
	[
		'governance',
		realm.toBuffer(),
		mint.toBuffer(),
		tokenOwner.toBuffer(),
	],
	programId
);

export const getNativeTreasuryPDA = async (governance: PublicKey, programId: PublicKey) => getPDA(
	[
		'native-treasury',
		governance.toBuffer(),
	],
	programId
);

const createCreateRealmInstruction = async (
	name: string,
	programId: PublicKey,
	realmAuthority: PublicKey,
	communityMint: PublicKey,
	payer: PublicKey
) => {
	const realmPDA = await getRealmPDA(name, programId);
	const communityTokenHoldingPDA = await getCommunityTokenHoldingPDA(realmPDA.publicKey, communityMint, programId);

	const args = new CreateRealmArgs({
		name,
		configArgs: new RealmConfigArgs({
			useCouncilMint: false,
			communityMintMaxVoteWeightSource: new MintMaxVoteWeightSource({ value: new BN('10000000000') }),
			minCommunityTokensToCreateGovernance: new BN('18446744073709551615'),
			useCommunityVoterWeightAddin: false,
			useMaxCommunityVoterWeightAddin: false,
		}),
	});
	const data = Buffer.from(
		serialize(
			getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION),
			args,
		)
	);
	const keys = [
		{
			pubkey: realmPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: realmAuthority,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: communityMint,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: communityTokenHoldingPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: true,
			isSigner: true,
		},
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
			pubkey: SYSVAR_RENT_PUBKEY,
			isWritable: false,
			isSigner: false,
		},
	];
	return new TransactionInstruction({
		keys,
		programId,
		data,
	})
}

const createCreateMintGovernanceInstruction = async (
	programId: PublicKey,
	realmAddress: PublicKey,
	communityMint: PublicKey,
	mintAuthority: PublicKey,
	governanceAuthority: PublicKey,
	payer: PublicKey,
) => {
	const governancePDA = await getMintGovernancePDA(realmAddress, communityMint, programId);
	const tokenOwnerRecordAddress = PublicKey.default;

	const args = new CreateMintGovernanceArgs({
		config: new GovernanceConfig({
			voteThresholdPercentage: new VoteThresholdPercentage({ value: 60 }),
			minCommunityTokensToCreateProposal: new BN('18446744073709551615'),
			minInstructionHoldUpTime: 0,
			maxVotingTime: 259200,
			minCouncilTokensToCreateProposal: new BN(1),
		}),
		transferMintAuthorities: false,
	})
	const data = Buffer.from(
		serialize(
			getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION),
			args,
		)
	);
	const keys = [
		{
			pubkey: realmAddress,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: governancePDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: communityMint,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: mintAuthority,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: tokenOwnerRecordAddress,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: TOKEN_PROGRAM_ID,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: SYSTEM_PROGRAM_ID,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: governanceAuthority,
			isWritable: false,
			isSigner: true,
		},
	];
	if (GOVERNANCE_PROGRAM_VERSION <= 1) {
		keys.push({
			pubkey: SYSVAR_RENT_PUBKEY,
			isWritable: false,
			isSigner: false,
		});
	}
	keys.push({
		pubkey: governanceAuthority,
		isWritable: false,
		isSigner: true,
	});
	return new TransactionInstruction({
		keys,
		programId,
		data,
	})
}

const createNativeTreasuryInstruction = async (
	programId: PublicKey,
	governanceAddress: PublicKey,
	payer: PublicKey,
) => {
	const nativeTreasuryPDA = await getNativeTreasuryPDA(governanceAddress, programId);
	const args = new CreateNativeTreasuryArgs();
	const data = Buffer.from(
		serialize(
			getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION),
			args,
		)
	);
	const keys = [
		{
			pubkey: governanceAddress,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: nativeTreasuryPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: true,
			isSigner: true,
		},
		{
			pubkey: SYSTEM_PROGRAM_ID,
			isWritable: false,
			isSigner: false,
		},
	];
	return new TransactionInstruction({
		keys,
		programId,
		data,
	})
}

export const createBasicDAOInstructions = async (
	connection: any,
	accounts: any,
	name: string,
	programId: PublicKey,
) => {
	const { payer, communityMint } = accounts;
	const realmPDA = await getRealmPDA(name, programId);
	const governancePDA = await getMintGovernancePDA(realmPDA.publicKey, communityMint, programId);

	const mintInstructions = await createMintInstructions(connection, payer, communityMint, 6);
	const instructions = [
		...mintInstructions,
		await createCreateRealmInstruction(
			name,
			programId,
			payer,
			communityMint,
			payer,
		),
		await createCreateMintGovernanceInstruction(
			programId,
			realmPDA.publicKey,
			communityMint,
			payer,
			payer,
			payer,
		),
		await createNativeTreasuryInstruction(
			programId,
			governancePDA.publicKey,
			payer,
		),
	];
	console.log(instructions);
	return instructions;
}

// export const createDepositCommunityTokenInstructions
// export const createWithdrawCommunityTokenInstructions
// export const createSubmitProposalInstructions
// export const createCastVoteInstruction





export const daoStep1 = async (wallet: any, connection: any, name: string) => {
	const communityMint = Keypair.generate();
	const realmPDA = await getRealmPDA(name, GOVERNANCE_PROGRAM_ID);
	const governancePDA = await getMintGovernancePDA(realmPDA.publicKey, communityMint.publicKey, GOVERNANCE_PROGRAM_ID);
	const instructions = await createBasicDAOInstructions(
		connection,
		{
			payer: wallet.publicKey,
			communityMint: communityMint.publicKey,
		},
		name,
		GOVERNANCE_PROGRAM_ID
	);
	const tx = await sendAndConfirmInstructions(wallet, connection, instructions, [communityMint]);
	return {
		communityMint,
		realmPDA,
		governancePDA,
		tx
	}
}

export const daoStep2 = async (wallet: any, connection: any) => {
	const communityMint = Keypair.generate();
	mintToInstructions(connection, wallet.publicKey, communityMint.publicKey, 12, new PublicKey('Aui657vkmeVDGX9GzE7j2B1RhZpbpQN6E9UeRCzqKvCd'));
}
