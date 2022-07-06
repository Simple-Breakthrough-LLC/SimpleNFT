import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { getCommunityMintInfo, createDepositCommunityTokenInstructions, getTokenOwnerRecordInfo, GOVERNANCE_PROGRAM_ID } from '../web3/governance.ts';
import { mintToInstructions, transferInstructions, getAssociatedTokenAccountPDA } from '../web3/token.js';
import { sendAndConfirmInstructions } from '../web3/utils.js';

export const ManageTokens = ({setView, addr}) => {
    // const { addr } = useParams();
    const realm = new PublicKey(addr);
    const { connection } = useConnection();
    const wallet = useWallet();
    const [communityMint, setCommunityMint] = useState(null);
    const [balance, setBalance] = useState(null);
    const [amount, setAmount] = useState(0);
    const [recipient, setRecipient] = useState('');
    // Aui657vkmeVDGX9GzE7j2B1RhZpbpQN6E9UeRCzqKvCd 
    const [activeTab, setActiveTab] = useState("transfer");

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

    const hashtable = {
        "mint" : mint,
        "transfer": transfer,
        "deposit": deposit,
        "withdraw":withdraw
    }

    useEffect(() => {
        if (!communityMint)
            getCommunityMintInfo(connection, realm)
                .then(setCommunityMint);
        if (communityMint && !balance)
            updateUserInfo();
    }, [communityMint, balance])

    console.log( activeTab == "transfer" || activeTab == "mint" )
    return (
      <Container>
          <TabNameRow>
              {
                  Object.keys(hashtable).map((name) =>
                    <TabName active={activeTab == name} onClick={() => setActiveTab(name)}>
                        {name}
                    </TabName>
                  )
              }
          </TabNameRow>
          <Tab>
                <Exit onClick={() => setView(false)}>
                   X Close
                </Exit>
                {balance
                ? <>Balance: {balance.ata + balance.deposited} ({balance.deposited} deposited)</>
                : 'Loading balance...'
                }
                <InputDiv>
                {
                    (activeTab == "transfer" || activeTab == "mint") &&
                    <>
                        <InputName>
                            To :
                        </InputName>
                        <Input
                        value={recipient}
                        onChange={(e) =>setRecipient(e.target.value)}
                        />
                    </>
                }
                </InputDiv>
                <InputDiv>
                    <InputName>
                        Amount
                    </InputName>
                    <Input
                    type="number"
                    value={amount}
                    onChange={(e) =>setAmount(e.target.value)}
                    />
                </InputDiv>
                <Submit onClick={hashtable[activeTab]}>
                    Submit
                </Submit>

        {/*
        <input type="text"></input>
        <input type="number"></input>
        <button onClick={transfer} disabled={!communityMint}>Transfer</button>
        <button onClick={mint} disabled={!communityMint}>Mint</button>
        <button onClick={deposit} disabled={!communityMint}>Deposit</button>
        <button onClick={withdraw} disabled={!communityMint}>Withdraw</button> */}
        </Tab>
      </Container>
    );
};

const Container = styled.div`
    display: flex;
    position: absolute;
    background: #80808075;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    align-items: center;
    justify-content: center;
`
const TabNameRow = styled.div`
    display:flex;
    flex-direction: row;
`

const TabName = styled.div`
    display: flex;
    padding: 5px;
    background: ${props =>props.active ? "beige" : "grey"};
    border: 2px solid black;
    border-bottom: 0px;
    border-radius: 5px;
    margin-bottom: -2px;
    cursor:pointer;
    z-index: 4;
`

const Tab = styled.div`
    display: flex;
    width: 30%;
    padding: 10px;
    border: 2px solid black;
    flex-direction: column;
    background: beige;
    gap: 10px;
    justify-content: center;
    align-items: center;
`
const InputDiv = styled.div`
    display:flex;
    flex-direction:column;
`
const InputName = styled.div`
    display:flex;
`
const Input = styled.input`
    display:flex;
    width: 100%;
`
const Exit = styled.button  `
    display: flex;
    position: relative;
    align-self: end;

`
const Submit = styled.button`
    display:flex;
`
// const InputNam = styled.div`
//     display:flex;
// `

