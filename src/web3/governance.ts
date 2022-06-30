import { PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { getPDA } from './utils.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { serialize } from 'borsh';
// We need to strategically avoid certain files in the spl governance library because of this issue:
//   https://github.com/facebook/create-react-app/pull/12021
import { getGovernanceSchema } from '@solana/spl-governance/lib/governance/serialisation';
import { MintMaxVoteWeightSource, RealmConfigArgs } from '@solana/spl-governance/lib/governance/accounts';
import { CreateRealmArgs } from '@solana/spl-governance/lib/governance/instructions';

const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
const GOVERNANCE_PROGRAM_VERSION = 2;

/*
const REALM_CONFIG_SCHEMA = {
	kind: 'struct',
	fields: [
		['useCouncilMint', 'u8'],
		['minCommunityTokensToCreateGovernance', 'u64'],
		// MintMaxVoteWeightSource
		['communityMintMaxVoteWeightSource', MintMaxVoteWeightSource],
		['useCommunityVoterWeightAddin', 'u8'],
		['useMaxCommunityVoterWeightAddin', 'u8'],
	],
};
const DEPOSIT_GOVERNING_TOKEN_SCHEMA = {
	kind: 'struct',
	fields: [
		['instruction', 'u8'],
		['amount', 'u64'],
	],
};
const CREATE_MINT_GOVERNANCE_SCHEMA = {
	kind: 'struct',
	fields: [
		['instruction', 'u8'],
		['config', GovernanceConfig],
		['transferMintAuthorities', 'u8'],
	],
};
const CREATE_PROPOSAL_SCHEMA = {
	kind: 'struct',
	fields: [
		['instruction', 'u8'],
		['name', 'string'],
		['descriptionLink', 'string'],
		['voteType', 'voteType'],
		['options', ['string']],
		['useDenyOption', 'u8'],
	],
};
const CAST_VOTE_ARGS = {
	kind: 'struct',
	fields: [
		['instruction', 'u8'],
		['vote', 'vote'],
	],
};
*/

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
)

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
			/*communityMintMaxVoteWeightSource: {
				type: 0, // SupplyFraction
				value: 10000000000,
			},*/
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

/*
const createCreateMintGovernanceInstruction = async () => {
	const keys = [
		{
			pubkey: realm,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: governanceAddress,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: governedMint,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: mintAuthority,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: tokenOwnerRecord,
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
	if (programVersion === 1) {
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
	const data = Buffer.from(serialize(schema, obj));
	return [keys, programId, data];
}
*/

// const createNativeTreasuryInstruction = async () => {

export const createBasicDAOInstructions = async (
	connection: any,
	accounts: any,
	name: string,
	programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw'),
) => {
	const { payer, communityMint, realm } = accounts;
	const communityTokenHoldingAddress = (await getCommunityTokenHoldingPDA(realm, communityMint, programId)).publicKey;

	const instructions = [
		await createCreateRealmInstruction(
			name,
			programId,
			payer,
			communityMint,
			payer,
		),
	];
	console.log('instruction', instructions);
	return instructions;
}

// export const createSubmitProposalInstructions
// export const createDepositCommunityTokenInstructions
// export const createCastVoteInstruction
