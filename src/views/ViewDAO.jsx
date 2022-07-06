import Axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

import { getDAO } from '../web3/governance.ts';
// We need to strategically avoid certain functions in the spl governance library because of this issue:
//   https://github.com/facebook/create-react-app/pull/12021
import { ProposalState } from '@solana/spl-governance/lib/governance/accounts';
import { VoteKind } from '@solana/spl-governance/lib/governance/instructions';
import { createCastVoteInstructions, createSubmitProposalInstructions, GOVERNANCE_PROGRAM_ID, sendAndConfirmInstructions } from "../web3";
import { ManageTokens } from "./ManageTokens";

export const ViewDAO = () => {
    const { addr } = useParams();
    const realm = new PublicKey(addr);
    const { connection } = useConnection();
    const wallet = useWallet();
    const [DAO, setDAO] = useState(null);
    const [viewTokens, setViewTokens] = useState(false);

    console.log(DAO);

    const newProposal = async () => {
        const name = 'Proposal name ' + Math.random();
        const description = 'Proposal description ' + Math.random();
        // TODO Honestly kinda terrible way of getting the index
        // TODO Should really load the proposals one index at a time rather than using getProgramAccounts
        const proposalIndex = DAO.proposals.length;
        const instructions = await createSubmitProposalInstructions(
            {
                payer: wallet.publicKey,
                realm,
                communityMint: DAO.communityMint.address,
            },
            proposalIndex,
            name,
            description,
            GOVERNANCE_PROGRAM_ID
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
    }

    const vote = async (proposal, approve) => {
        const instructions = await createCastVoteInstructions(
            {
                payer: wallet.publicKey,
                realm,
                communityMint: DAO.communityMint.address,
                proposal: proposal.account,
                proposalOwnerRecord: proposal.tokenOwnerRecord,
            },
            approve,
            GOVERNANCE_PROGRAM_ID,
        );
        await sendAndConfirmInstructions(wallet, connection, instructions);
    }

    const formatProposal = (proposal) => {
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
            tokenOwnerRecord: proposal.data.tokenOwnerRecord,
            yesVotes,
            noVotes,
        }
    }

    const fetchDAO = async () => {
        const dao = await getDAO(connection, realm);
        dao.proposals = dao.proposals.map(formatProposal);
        setDAO(dao);
    }

    const votesToInt = (votes) =>
    {
      return votes / 10 ** DAO.communityMint.decimals
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
        <ProposalTitle> {proposal.name} ({ProposalState[proposal.state]}) </ProposalTitle>
        <ProposalText numberOfLines={1}>{proposal.description}</ProposalText>
        <VoteCol>
          <VoteTextRow>
            <VoteText>yes: {votesToInt(proposal.yesVotes)}</VoteText>
            <VoteText>no : {votesToInt(proposal.noVotes)}</VoteText>
          </VoteTextRow>
          <VoteBar
            yes ={(votesToInt(proposal.yesVotes) * 100) / (votesToInt(proposal.yesVotes) + votesToInt(proposal.noVotes))}
            no = {(votesToInt(proposal.noVotes) * 100) / (votesToInt(proposal.yesVotes) + votesToInt(proposal.noVotes))}
          />
          {proposal.state == ProposalState.Voting
            ? <VoteRow>
              <VoteButton color="green" onClick={() => vote(proposal, true)}>YES</VoteButton>
              <VoteButton color="red" onClick={() => vote(proposal, false)}>NO</VoteButton>
            </VoteRow>
            : null
          }
        </VoteCol>
      </ProposalCard>
    );

    return (
      <>
        { viewTokens && <ManageTokens setView={setViewTokens} addr={addr}/> }
      <Container>
        <DAOName>{DAO.realmData.name}</DAOName>
        <TopRow>
            <TopButton onClick={() => setViewTokens(true)}> Transfer tokens</TopButton>
          <TopButton onClick={newProposal}> New Proposal </TopButton>
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
      </Container>
      </>
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
  height:14px;
  padding:0px 1px;
  &::before {
    border-radius: 8px;
    background: green;
    width: ${props =>props.yes}%;
    content:"";
  }
  &:after {
    background: ${props => props.no ? "red" : "white"};
    width: ${props => props.no}%;
    content: "";
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