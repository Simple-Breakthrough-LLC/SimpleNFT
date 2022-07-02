import Axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { getDAO } from '../web3/governance.ts';
import { mintToInstructions, transferInstructions } from '../web3/token.js';
import { sendAndConfirmInstructions } from '../web3/utils.js';
// We need to strategically avoid certain functions in the spl governance library because of this issue:
//   https://github.com/facebook/create-react-app/pull/12021
import { ProposalState } from '@solana/spl-governance/lib/governance/accounts';
import { VoteKind } from '@solana/spl-governance/lib/governance/instructions';

export const ViewDAO = () => {
    const { addr } = useParams();
    const { connection } = useConnection();
    const wallet = useWallet();
    const [DAO, setDAO] = useState(null);
    const [amount, setAmount] = useState(10);
    const [recipient, setRecipient] = useState('Aui657vkmeVDGX9GzE7j2B1RhZpbpQN6E9UeRCzqKvCd');

    const formatProposal = (proposal, communityMint) => {
        let yesVotes = 0;
        let noVotes = 0;
        for (const vote of proposal.votes) {
            if (vote.vote.voteType === VoteKind.Approve)
                yesVotes += Number(vote.voterWeight);
            else
                noVotes += Number(vote.voterWeight);
        }
        return {
            account: proposal.account.pubkey,
            name: proposal.data.name,
            description: proposal.data.descriptionLink,
            state: proposal.data.state,
            yesVotes,
            noVotes,
        }
    }

    const fetchDAO = async () => {
        const dao = await getDAO(connection, new PublicKey(addr));
        dao.proposals = dao.proposals.map(formatProposal);
        setDAO(dao);
    }

    const mint = async () => {
        const instructions = await mintToInstructions(
            connection,
            wallet.publicKey,
            DAO.realmData.communityMint,
            Number(amount),
            new PublicKey(recipient),
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
    }

    const transfer = async () => {
        const instructions = await transferInstructions(
            connection,
            wallet.publicKey,
            DAO.realmData.communityMint,
            Number(amount),
            new PublicKey(recipient),
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
    }

    useEffect(() => {
        if (!DAO)
            fetchDAO();
    }, [])

    if (!DAO)
        return 'Loading...';

    const openProposals = DAO.proposals.filter((proposal) => proposal.state === ProposalState.Voting);
    const closedProposals = DAO.proposals.filter((proposal) => proposal.state !== ProposalState.Voting);

    const proposalHTML = (proposal) => (
      <ProposalCard key={proposal.account}>
        <ProposalTitle> {proposal.name} </ProposalTitle>
        <ProposalText numberOfLines={1}>{proposal.description}</ProposalText>
        <VoteCol>
          <VoteTextRow>
            <VoteText>yes : {proposal.yesVotes / 10 ** DAO.communityMint.decimals}</VoteText>
            <VoteText>no : {proposal.noVotes / 10 ** DAO.communityMint.decimals}</VoteText>
          </VoteTextRow>
          <VoteBar
            yes = {(proposal.voteTotal * 100) / proposal.voteCount}
            no = {100 - ((proposal.voteTotal * 100) / proposal.voteCount)}
          />
          {proposal.state == 'Voting'
            ? <VoteRow>
              <VoteButton color="green">YES</VoteButton>
              <VoteButton color="red">NO</VoteButton>
            </VoteRow>
            : null
          }
        </VoteCol>
      </ProposalCard>
    );

    return (
      <Container>
        <DAOName>{DAO.name}</DAOName>
        <TopRow>
          <TopButton> Transfer tokens</TopButton>
          <TopButton> New Proposal </TopButton>
        </TopRow>
        <RowName> Open </RowName>
        <ProposalRow>
          {openProposals.map(proposalHTML)}
        </ProposalRow>
        <Divider/>
        <RowName> Closed </RowName>
        <ProposalRow>
          {closedProposals.map(proposalHTML)}
        </ProposalRow>
        Transfer tokens:
        Amount: 10
        To: Aui657vkmeVDGX9GzE7j2B1RhZpbpQN6E9UeRCzqKvCd
        <button onClick={transfer} disabled={!DAO}>Transfer</button>
        <button onClick={mint} disabled={!DAO}>Mint</button>
      </Container>
    );
};

const Container = styled.div`
  display: flex;
  flex-direction: Column;
  justify-content: center;
  padding-top: 60px;
  gap: 30px;

  align-items: center;
  input {
    box-sizing: border-box;
  }
`;
const Divider = styled.div`
  width: 50%;
  border-top: 3px solid lightgrey;
`;

const DAOName = styled.div`
  font-size: 24px;
  font-family: Spartan;
  font-weight: 700;
  color: #06005b;
`
const TopRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0px 10px;
  width:80%;
`

const TopButton = styled.button`
  border: 1px solid black;
  background: grey;
  padding : 5px 10px;
  border-radius: 8px;
`

const VoteButton = styled.button`
  border: 1px solid black;
  background: ${props => props.color};
  padding : 5px 10px;
  border-radius: 8px;
`
const ProposalCard = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  justify-content: space-between;
  gap: 15px;
  width: 25%;
  border: 1px solid black;
  border-radius: 8px;
  min-height: 200px;
`

const RowName = styled.div`
  display: flex;
`

const ProposalTitle = styled.div`
  display:flex;
`

const ProposalText = styled.p`
  display:flex;
  flex-wrap: wrap;
  word-break: break-word;
`

const VoteTextRow = styled.div`
  display:flex;
  justify-content: space-between;
`

const VoteText = styled.div`
  display:flex;
`

const VoteBar = styled.div`
  display:flex;
  background: white;
  border: 2px solid grey;
  border-radius: 8px;
  height:11px;
  padding:0px 1px;
  &::after {
    border-radius: 8px;
    background: green;
    width: ${props =>props.yes}%;
    content:"";
  }
`
const TimeLeft = styled.div`
  display:flex;
`

const VoteRow = styled.div`
  display:flex;
  flex-direction: row;
  justify-content: space-around;
`
const VoteCol = styled.div`
  display:flex;
  flex-direction: column;
  justify-content: space-around;
  gap : 10px;
`

const ProposalRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  flex-wrap: wrap;
  margin: auto;
`