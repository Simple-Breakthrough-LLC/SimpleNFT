import { AccountInfo, Keypair, PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { getPDA, sendAndConfirmInstructions } from './utils.js';
import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import BN from 'bn.js';
import { serialize } from 'borsh';
// We need to strategically avoid certain functions in the spl governance library because of this issue:
//   https://github.com/facebook/create-react-app/pull/12021
import { getGovernanceSchema, GOVERNANCE_SCHEMA } from '@solana/spl-governance/lib/governance/serialisation';
import {
	GovernanceConfig,
	MintMaxVoteWeightSource,
	RealmConfigArgs,
	VoteThresholdPercentage,
	GovernanceAccountType,
	Realm,
	Proposal,
	VoteRecord,
	VoteType,
	TokenOwnerRecord
} from '@solana/spl-governance/lib/governance/accounts';
import { CastVoteArgs, CreateMintGovernanceArgs, CreateNativeTreasuryArgs, CreateProposalArgs, CreateRealmArgs, DepositGoverningTokensArgs, Vote, VoteKind, YesNoVote, VoteChoice, AddSignatoryArgs, SignOffProposalArgs } from '@solana/spl-governance/lib/governance/instructions';
import { createMintInstructions, getAssociatedTokenAccountPDA, mintToInstructions } from './token.js';

// Fixes for missing functions in borsh
import { deserializeBorsh } from '@solana/spl-governance/lib/tools/borsh';
export * from './borsh';

const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
export const GOVERNANCE_PROGRAM_ID = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
export const GOVERNANCE_PROGRAM_VERSION = 2;

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

export const getProposalPDA = async (governance: PublicKey, communityMint: PublicKey, index: number, programId: PublicKey) => {
	const proposalIndexBuffer = Buffer.alloc(4);
	proposalIndexBuffer.writeInt32LE(index, 0);
	return getPDA(
		[
			'governance',
			governance.toBuffer(),
			communityMint.toBuffer(),
			proposalIndexBuffer,
		],
		programId
	);
}

export const getVoteRecordPDA = async (proposal: PublicKey, tokenOwnerRecord: PublicKey, programId: PublicKey) => getPDA(
	[
		'governance',
		proposal.toBuffer(),
		tokenOwnerRecord.toBuffer(),
	],
	programId
);

export const getRealmConfigPDA = async (realm: PublicKey, programId: PublicKey) => getPDA(
	[
		'realm-config',
		realm.toBuffer(),
	],
	programId
);

export const getSignatoryRecordPDA = async (proposal: PublicKey, signatory: PublicKey, programId: PublicKey) => getPDA(
	[
		'governance',
		proposal.toBuffer(),
		signatory.toBuffer(),
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
			minCommunityTokensToCreateProposal: new BN(1),
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

const createDepositGoverningTokensInstruction = async (
	programId: PublicKey,
	realmAddress: PublicKey,
	communityMint: PublicKey,
	payerTokenAccount: PublicKey,
	amount: BN,
	payer: PublicKey,
) => {
	const communityTokenHoldingPDA = await getCommunityTokenHoldingPDA(realmAddress, communityMint, programId);
	const tokenOwnerRecordPDA = await getTokenOwnerRecordPDA(realmAddress, communityMint, payer, programId);
	const args = new DepositGoverningTokensArgs({ amount });
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
			pubkey: communityTokenHoldingPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: payerTokenAccount,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: true,
			isSigner: true,
		},
		{
			pubkey: payer,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: tokenOwnerRecordPDA.publicKey,
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
	];
	return new TransactionInstruction({
		keys,
		programId,
		data,
	});
}

export const createSubmitProposalInstruction = async (
	programId: PublicKey,
	realmAddress: PublicKey,
	communityMint: PublicKey,
	governanceAuthority: PublicKey,
	proposalIndex: number,
	proposalName: string,
	proposalDescription: string,
	payer: PublicKey,
) => {
	const governancePDA = await getMintGovernancePDA(realmAddress, communityMint, programId);
	const proposalPDA = await getProposalPDA(governancePDA.publicKey, communityMint, proposalIndex, programId);
	const proposalOwnerRecordPDA = await getTokenOwnerRecordPDA(realmAddress, communityMint, payer, programId);
	const realmConfigPDA = await getRealmConfigPDA(realmAddress, programId);
	const args = new CreateProposalArgs({
		name: proposalName,
		descriptionLink: proposalDescription,
		governingTokenMint: communityMint,
		voteType: VoteType.SINGLE_CHOICE,
		options: ["Approve"],
		useDenyOption: true,
	});
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
			pubkey: proposalPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: governancePDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: proposalOwnerRecordPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: communityMint,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: governanceAuthority,
			isWritable: false,
			isSigner: true,
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
			pubkey: realmConfigPDA.publicKey,
			isWritable: false,
			isSigner: false,
		},
	];
	return new TransactionInstruction({
		keys,
		programId,
		data,
	});
}

export const createAddSignatoryInstruction = async (
	programId: PublicKey,
	realmAddress: PublicKey,
	communityMint: PublicKey,
	governanceAuthority: PublicKey,
	proposalIndex: number,
	payer: PublicKey,
) => {
	const governancePDA = await getMintGovernancePDA(realmAddress, communityMint, programId);
	const proposalPDA = await getProposalPDA(governancePDA.publicKey, communityMint, proposalIndex, programId);
	const tokenOwnerRecordPDA = await getTokenOwnerRecordPDA(realmAddress, communityMint, payer, programId);
	const signatoryRecordPDA = await getSignatoryRecordPDA(proposalPDA.publicKey, payer, programId);
	const args = new AddSignatoryArgs({ signatory: payer });
	const data = Buffer.from(
		serialize(
			getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION),
			args,
		)
	);
	const keys = [
		{
			pubkey: proposalPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: tokenOwnerRecordPDA.publicKey,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: governanceAuthority,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: signatoryRecordPDA.publicKey,
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
	});
}

export const createSignOffProposalInstruction = async (
	programId: PublicKey,
	realmAddress: PublicKey,
	communityMint: PublicKey,
	proposalIndex: number,
	payer: PublicKey,
) => {
	const governancePDA = await getMintGovernancePDA(realmAddress, communityMint, programId);
	const proposalPDA = await getProposalPDA(governancePDA.publicKey, communityMint, proposalIndex, programId);
	const signatoryRecordPDA = await getSignatoryRecordPDA(proposalPDA.publicKey, payer, programId);
	const args = new SignOffProposalArgs();
	const data = Buffer.from(
		serialize(
			getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION),
			args,
		)
	);
	const keys = [
		{
			pubkey: realmAddress,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: governancePDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: proposalPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: signatoryRecordPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
	];
	return new TransactionInstruction({
		keys,
		programId,
		data,
	});
}

export const createCastVoteInstruction = async (
	programId: PublicKey,
	realmAddress: PublicKey,
	communityMint: PublicKey,
	proposalAddress: PublicKey,
	proposalOwnerRecordAddress: PublicKey,
	governanceAuthority: PublicKey,
	approve: boolean,
	payer: PublicKey,
) => {
	const governancePDA = await getMintGovernancePDA(realmAddress, communityMint, programId);
	const tokenOwnerRecordPDA = await getTokenOwnerRecordPDA(realmAddress, communityMint, payer, programId);
	const voteRecordPDA = await getVoteRecordPDA(proposalAddress, tokenOwnerRecordPDA.publicKey, programId);
	const realmConfigPDA = await getRealmConfigPDA(realmAddress, programId);
	const args = new CastVoteArgs({
		vote: new Vote({
			voteType: approve ? VoteKind.Approve : VoteKind.Deny,
			approveChoices: [ new VoteChoice({ rank: 0, weightPercentage: 100 }) ],
			deny: undefined,
		}),
		yesNoVote: undefined,
	});
	const data = Buffer.from(
		serialize(
			getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION),
			args,
		)
	);
	const keys = [
		{
			pubkey: realmAddress,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: governancePDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: proposalAddress,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: proposalOwnerRecordAddress,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: tokenOwnerRecordPDA.publicKey,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: governanceAuthority,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: voteRecordPDA.publicKey,
			isWritable: true,
			isSigner: false,
		},
		{
			pubkey: communityMint,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: payer,
			isWritable: false,
			isSigner: true,
		},
		{
			pubkey: SYSTEM_PROGRAM_ID,
			isWritable: false,
			isSigner: false,
		},
		{
			pubkey: realmConfigPDA.publicKey,
			isWritable: false,
			isSigner: false,
		},
	];
	return new TransactionInstruction({
		keys,
		programId,
		data,
	});
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
	return instructions;
}

export const createDepositCommunityTokenInstructions = async (
	accounts: { payer: PublicKey, realm: PublicKey, communityMint: PublicKey },
	amount: BN | string,
	programId: PublicKey,
) => {
	amount = new BN(amount);
	const { payer, realm, communityMint } = accounts;
	const payerTokenAccount = await getAssociatedTokenAccountPDA(communityMint, payer);

	const instructions = [
		await createDepositGoverningTokensInstruction(
			programId,
			realm,
			communityMint,
			payerTokenAccount.publicKey,
			amount,
			payer,
		),
	];
	return instructions;
}

// export const createWithdrawCommunityTokenInstructions

export const createSubmitProposalInstructions = async (
	accounts: any,
	proposalIndex: number,
	proposalName: string,
	proposalDescription: string,
	programId: PublicKey,
) => {
	const { payer, realm, communityMint } = accounts;
	return [
		await createSubmitProposalInstruction(
			programId,
			realm,
			communityMint,
			payer,
			proposalIndex,
			proposalName,
			proposalDescription,
			payer,
		),
		await createAddSignatoryInstruction(
			programId,
			realm,
			communityMint,
			payer,
			proposalIndex,
			payer,
		),
		await createSignOffProposalInstruction(
			programId,
			realm,
			communityMint,
			proposalIndex,
			payer,
		),
	];
}

export const createCastVoteInstructions = async (
	accounts: any,
	approve: boolean,
	programId: PublicKey,
) => {
	const { payer, realm, communityMint, proposal, proposalOwnerRecord } = accounts;
	return [
		await createCastVoteInstruction(
			programId,
			realm,
			communityMint,
			proposal,
			proposalOwnerRecord,
			payer,
			approve,
			payer,
		)
	];
}




export const helpers_createDAO = async (wallet: any, connection: any, name: string) => {
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

const accountTypeFilter = (type : GovernanceAccountType) => {
	return (account : any) => account.account.data[0] === type;
}

export const getCommunityMintInfo = async (connection: any, realm: PublicKey) => {
	const GOVERNANCE_SCHEMA = getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION);
	const realmInfo = await connection.getParsedAccountInfo(realm);
	const realmData : Realm = deserializeBorsh(
		GOVERNANCE_SCHEMA,
		Realm,
		Buffer.from(realmInfo.value.data),
	);
	const mintInfo = await connection.getParsedAccountInfo(realmData.communityMint);
	return {
		publicKey: realmData.communityMint,
		decimals: mintInfo.value.data.parsed.info.decimals
	};
}

export const getTokenOwnerRecordInfo = async (connection: any, realm: PublicKey, communityMint: PublicKey, tokenOwner: PublicKey) => {
	const tokenOwnerRecordPDA = await getTokenOwnerRecordPDA(realm, communityMint, tokenOwner, GOVERNANCE_PROGRAM_ID);
	const info = await connection.getParsedAccountInfo(tokenOwnerRecordPDA.publicKey);
	if (!info.value)
		return {
			governingTokenDepositAmount: 0,
			unrelinquishedVotesCount: 0,
			totalVotesCount: 0,
			outstandingProposalCount: 0,
		};
	const data = deserializeBorsh(
		GOVERNANCE_SCHEMA,
		TokenOwnerRecord,
		Buffer.from(info.value.data),
	);
	return {
		governingTokenDepositAmount: data.governingTokenDepositAmount,
		unrelinquishedVotesCount: data.unrelinquishedVotesCount,
		totalVotesCount: data.totalVotesCount,
		outstandingProposalCount: data.outstandingProposalCount,
	};
}

export const getDAO = async (connection: any, realm: PublicKey) => {
	const GOVERNANCE_SCHEMA = getGovernanceSchema(GOVERNANCE_PROGRAM_VERSION);
	const info = await connection.getParsedAccountInfo(realm);
	if (!info.value)
		return null;
	const realmData : Realm = deserializeBorsh(
		GOVERNANCE_SCHEMA,
		Realm,
		Buffer.from(info.value.data),
	);
	const communityMint = realmData.communityMint;
	const governanceAddress = (await getMintGovernancePDA(
		realm,
		communityMint,
		GOVERNANCE_PROGRAM_ID
	)).publicKey;

	console.log('Fetching governance accounts...');
	const governanceAccounts = await connection.getProgramAccounts(GOVERNANCE_PROGRAM_ID);
	console.log('Searching', governanceAccounts.length, 'accounts...');
	const proposalAccounts = governanceAccounts.filter(accountTypeFilter(GovernanceAccountType.ProposalV2));
	const voteRecordAccounts = governanceAccounts.filter(accountTypeFilter(GovernanceAccountType.VoteRecordV2));
	const proposals = [];
	for (const account of proposalAccounts)
	{
		const proposalData : Proposal = deserializeBorsh(
			GOVERNANCE_SCHEMA,
			Proposal,
			account.account.data
		);
		if (proposalData.governance.equals(governanceAddress))
			proposals.push({ account, data: proposalData, votes: [] as any[] });
	}
	for (const account of voteRecordAccounts)
	{
		const voteRecordData : VoteRecord = deserializeBorsh(
			GOVERNANCE_SCHEMA,
			VoteRecord,
			account.account.data
		);
		for (const proposal of proposals)
			if (voteRecordData.proposal.equals(proposal.account.pubkey))
				proposal.votes.push(voteRecordData);
	}
	console.log('Done searching. Found', proposals.length, 'proposals.');
	return {
		realmData,
		communityMint: await getMint(connection, realmData.communityMint),
		governanceAddress,
		proposals,
	};
}
