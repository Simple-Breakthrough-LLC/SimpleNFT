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
	PROGRAM_ID as CANDY_MACHINE_PROGRAM_V2_ID,
	createSetCollectionInstruction,
	createAddConfigLinesInstruction,
} from '@metaplex-foundation/mpl-candy-machine';
import {
	createCreateMetadataAccountV2Instruction,
	createCreateMasterEditionV3Instruction,
} from '@metaplex-foundation/mpl-token-metadata';
import {
	CONFIG_ARRAY_START_V2,
	CONFIG_LINE_SIZE_V2,
} from './constants.js';
const web3 = require('@solana/web3.js');

// TODO get this from metaplex
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

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
	if (candyData.sellerFeeBasisPoints >= 10000)
		return {err: "Seller fee basis points must be less than 100%."}
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

export const getPDA = async (seeds, programId) => {
	const pda = await web3.PublicKey.findProgramAddress(
		seeds,
		programId
	);
	return {
		publicKey: pda[0],
		bumpSeed: pda[1]
	};
}

export const getMetadataPDA = async (collectionMint) => getPDA(
	[
		'metadata',
		TOKEN_METADATA_PROGRAM_ID.toBuffer(),
		collectionMint.toBuffer()
	],
	TOKEN_METADATA_PROGRAM_ID
);

export const getMasterEditionPDA = async (collectionMint) => getPDA(
	[
		'metadata',
		TOKEN_METADATA_PROGRAM_ID.toBuffer(),
		collectionMint.toBuffer(),
		'edition'
	],
	TOKEN_METADATA_PROGRAM_ID
);

export const getCollectionPDA = async (candyMachine) => getPDA(
	[
		'collection',
		candyMachine.toBuffer(),
	],
	CANDY_MACHINE_PROGRAM_V2_ID
);

export const getCollectionAuthorityRecordPDA = async (collectionMint, collectionAuthority) => getPDA(
	[
		'metadata',
		TOKEN_METADATA_PROGRAM_ID.toBuffer(),
		collectionMint.toBuffer(),
		'collection_authority',
		collectionAuthority.toBuffer(),
	],
	TOKEN_METADATA_PROGRAM_ID
);

export const setCollectionInstructions = async (connection, accounts, candyData) => {
	const { payer, collectionMint, candyMachine } = accounts;
	const associatedTokenAccount = await getAssociatedTokenAddress(
		collectionMint.publicKey,
		payer
	);
	const metadataPDA = await getMetadataPDA(collectionMint.publicKey);
	const masterEdition = await getMasterEditionPDA(collectionMint.publicKey);
	const collectionPDA = await getCollectionPDA(candyMachine.publicKey);
	const collectionAuthorityRecordPDA = await getCollectionAuthorityRecordPDA(collectionMint.publicKey, collectionPDA.publicKey);
	const instructions = [
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
		createCreateMetadataAccountV2Instruction(
			{
				metadata: metadataPDA.publicKey,
				mint: collectionMint.publicKey,
				mintAuthority: payer,
				payer,
				updateAuthority: payer,
			},
			{
				createMetadataAccountArgsV2: {
					data: {
						collection: null, // TODO {verified, key}
						creators: candyData.creators,
						name: 'Collection NFT',
						sellerFeeBasisPoints: candyData.sellerFeeBasisPoints,
						symbol: candyData.symbol,
						uri: '',
						uses: null, // TODO {useMethod, remaining, total}
					},
					isMutable: true,
				},
			},
		),
		createCreateMasterEditionV3Instruction(
			{
				edition: masterEdition.publicKey,
				mint: collectionMint.publicKey,
				updateAuthority: payer,
				mintAuthority: payer,
				payer,
				metadata: metadataPDA.publicKey,
			},
			{
				createMasterEditionArgs: {
					maxSupply: 0,
				}
			}
		),
	];
	const setCollectionInstruction = createSetCollectionInstruction({
		candyMachine: candyMachine.publicKey,
		authority: payer,
		collectionPda: collectionPDA.publicKey,
		payer,
		metadata: metadataPDA.publicKey,
		mint: collectionMint.publicKey,
		edition: masterEdition.publicKey,
		collectionAuthorityRecord: collectionAuthorityRecordPDA.publicKey,
		tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
	});
	// set candy machine as writable, because metaplex gets it wrong
	setCollectionInstruction.keys[0].isWritable = true;
	instructions.push(setCollectionInstruction);
	return instructions;
}

const uuidFromConfigPubkey = configAccount => configAccount.toBase58().slice(0, 6);

export const sendAndConfirmInstructions = (
	wallet,
	connection,
	instructions,
	signers=[],
	commitment='processed'
) => new Promise(async (resolve, reject) => {
	const transaction = new web3.Transaction();
	transaction.add(...instructions);
	const signature = await wallet.sendTransaction(
		transaction,
		connection,
		{signers}
	);
	connection.onSignature(signature, (result, context) => {
		if (result.err)
			reject({signature, result, context});
		else
			resolve({signature, result, context});
	}, commitment);
})

export const createCandyMachine = async (wallet, connection, candyData) => {
	const payer = wallet.publicKey;
	const candyMachine = web3.Keypair.generate();
	const collectionMint = web3.Keypair.generate();
	const metadataPDA = await getMetadataPDA(collectionMint.publicKey);
	const masterEditionPDA = await getMasterEditionPDA(collectionMint.publicKey);
	const collectionPDA = await getCollectionPDA(candyMachine.publicKey);
	const collectionAuthorityRecordPDA = await getCollectionAuthorityRecordPDA(collectionMint.publicKey, collectionPDA.publicKey);

	const defaultData = {
		uuid: uuidFromConfigPubkey(candyMachine.publicKey),
		price: 0,
		//symbol,
		sellerFeeBasisPoints: 0,
		maxSupply: 1,
		isMutable: true,
		retainAuthority: true,
		goLiveDate: 1640390400, // TODO can probably make this null? or zero?
		endSettings: null,
		creators: [
			{
				address: payer,
				verified: true,
				share: 100
			}
		],
		hiddenSettings: null,
		whitelistMintSettings: null,
		itemsAvailable: 1,
		gatekeeper: null,
	};
	for (const field in defaultData)
		if (!(field in candyData))
			candyData[field] = defaultData[field];
	if (!('itemsAvailable' in candyData))
		candyData.itemsAvailable = candyData.maxSupply;

	const status = checkCandyData(candyData);
	if (status.err)
		return status;

	const treasuryWallet = payer;
	// TODO If payment is with a token, then either generate the treasury wallet, or demand from user

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

	const firstTx = await sendAndConfirmInstructions(wallet, connection, initInstructions, [candyMachine]);
	const secondTx = await sendAndConfirmInstructions(wallet, connection, collectionInstructions, [collectionMint]);

	return {
		payer,
		candyMachine: candyMachine.publicKey,
		collectionMint: collectionMint.publicKey,
		collectionMetadata: metadataPDA.publicKey,
		collectionMasterEdition: masterEditionPDA.publicKey,
		collection: collectionPDA.publicKey,
		collectionAuthorityRecord: collectionAuthorityRecordPDA.publicKey,
		firstTx,
		secondTx,
	}
}
