import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { getCommunityMintInfo, createDepositCommunityTokenInstructions, getTokenOwnerRecordInfo, GOVERNANCE_PROGRAM_ID } from '../web3/governance.ts';
import { mintToInstructions, transferInstructions, getAssociatedTokenAccountPDA } from '../web3/token.js';
import { sendAndConfirmInstructions } from '../web3/utils.js';

export const ManageTokens = () => {
    const { addr } = useParams();
    const realm = new PublicKey(addr);
    const { connection } = useConnection();
    const wallet = useWallet();
    const [communityMint, setCommunityMint] = useState(null);
    const [balance, setBalance] = useState(null);
    const [amount, setAmount] = useState(10000000);
    const [recipient, setRecipient] = useState('Aui657vkmeVDGX9GzE7j2B1RhZpbpQN6E9UeRCzqKvCd');

    const updateUserInfo = async () => {
        const ata = await getAssociatedTokenAccountPDA(communityMint.publicKey, wallet.publicKey);
        const ataInfo = await connection.getParsedAccountInfo(ata.publicKey);
        const userBalance = {};
        if (ataInfo.value) {
            const amount = ataInfo.value.data.parsed.info.tokenAmount.amount;
            userBalance.ata = Number(amount) / (10 ** communityMint.decimals);
        }
        else
            userBalance.ata = 0;

        const tokenOwnerRecord = await getTokenOwnerRecordInfo(connection, realm, communityMint.publicKey, wallet.publicKey);
        userBalance.deposited = tokenOwnerRecord.governingTokenDepositAmount / (10 ** communityMint.decimals);
        setBalance(userBalance);
    }

    const mint = async () => {
        const instructions = await mintToInstructions(
            connection,
            wallet.publicKey,
            communityMint.publicKey,
            Number(amount),
            new PublicKey(recipient),
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
    }

    const transfer = async () => {
        const instructions = await transferInstructions(
            connection,
            wallet.publicKey,
            communityMint.publicKey,
            Number(amount),
            new PublicKey(recipient),
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
    }

    const deposit = async () => {
        const instructions = await createDepositCommunityTokenInstructions(
            {
                payer: wallet.publicKey,
                realm,
                communityMint: communityMint.publicKey,
            },
            amount,
            GOVERNANCE_PROGRAM_ID,
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
        updateUserInfo();
    }

    const withdraw = async () => {
        throw 'Not implemented';
    }

    useEffect(() => {
        if (!communityMint)
            getCommunityMintInfo(connection, realm)
                .then(setCommunityMint);
        if (communityMint && !balance)
            updateUserInfo();
    }, [communityMint, balance])

    return (
      <>
        {balance
          ? <>Balance: {balance.ata + balance.deposited} ({balance.deposited} deposited)</>
          : 'Loading balance...'
        }
        <input type="text"></input>
        <input type="number"></input>
        <button onClick={transfer} disabled={!communityMint}>Transfer</button>
        <button onClick={mint} disabled={!communityMint}>Mint</button>
        <button onClick={deposit} disabled={!communityMint}>Deposit</button>
        <button onClick={withdraw} disabled={!communityMint}>Withdraw</button>
      </>
    );
};
