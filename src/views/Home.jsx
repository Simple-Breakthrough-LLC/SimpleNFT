import { useState, useEffect } from "react";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, PublicKey } from '@solana/web3.js';
import { sendAndConfirmInstructions } from '../web3/utils.js';
import { createNewReflectionTokenInstruction } from '../web3/reflection';

export const Home = () => {
	const { connection } = useConnection();
	const wallet = useWallet();

	const test = async () => {
		const mint = Keypair.generate();
		const instructions = [
			await createNewReflectionTokenInstruction(
				mint.publicKey,
				wallet.publicKey,
			),
		];
		console.log('sending', instructions);
		sendAndConfirmInstructions(wallet, connection, instructions, [mint]);
	}

	return <button onClick={test}>Create</button>;
}
