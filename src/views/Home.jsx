import { useState, useEffect } from "react";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { Keypair, PublicKey } from '@solana/web3.js';
import { sendAndConfirmInstructions } from '../web3/utils.js';
import { createNewReflectionTokenInstruction } from '../web3/reflection';


export const REFLECTION_PROGRAM_ID_RS = new PublicKey('28cwbHshz1Rb3sH5p4DiRr6Rdq9dJtBNUBAAkCnAbJrR');
export const REFLECTION_PROGRAM_ID_C = new PublicKey('5rBGY6sVszWwMBA7EVSiBVYKXsysupdFgNBwbKVnDf1X');

export const Home = () => {
	const { connection } = useConnection();
	const wallet = useWallet();

	const test = async (id) => {
		const mint = Keypair.generate();
		const instructions = [
			await createNewReflectionTokenInstruction(
				mint.publicKey,
				wallet.publicKey,
				id
			),
		];
		console.log('sending', instructions);
		sendAndConfirmInstructions(wallet, connection, instructions, [mint]);
	}

	return (
		<>
			<button onClick={() =>test(REFLECTION_PROGRAM_ID_RS)}>Create Rust</button>;
			<button onClick={() =>test(REFLECTION_PROGRAM_ID_C)}>Create C</button>;
		</>
	) 
}
