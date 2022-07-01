import Axios from "axios";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from "@solana/web3.js";

import { getDAO } from "../web3/governance.ts";

const DummyDAO = {
  name: "BIRDAO",
  symbol: "OvO",
  proposals : {
    0 : {
      title: "First proposal",
      text:"BIRD DAO! BIRD DAO!BIRD DAO!vBIRD DAO!BIRD DAO!BIRD DAO!BIRD DAO!BIRD DAO!BIRD DAO! BIRD DAO! BIRD DAO! BIRD DAO! BIRD DAO!",
      status : false,
      voteTotal : 10,
      voteCount : 10,
      hasVoted : true
    },
    1 : {
      title: "Second proposal",
      text: "ThisIsAVeryLongTextNoOneWritesLikeTHisButYouNeverKnow,ThisSpansMultipleLinesHopefully:)",
      status : true,
      voteTotal : 1,
      voteCount : 10,
      hasVoted : true
    },
    2 : {
      title: "Third proposal",
      text: "Here is the third proposal, written like a normal person would",
      status : true,
      voteTotal : 7,
      voteCount : 10,
      hasVoted : true
    },
    3 : {
      title: "Fourth proposal",
      text: "AAAAAAAAAAAAAAAAAAAAAA THIS IS THE FOURHT ONE",
      status : false,
      voteTotal : 5,
      voteCount : 10,
      hasVoted : true
    }
  }
}

export const ViewDAO = ({}) => {
  const { connection } = useConnection();
  const [DAO_Info, setDAO_Info] = useState(null)
  const { addr } = useParams();

  getDAO(connection, new PublicKey(addr));

  /*
  const fetchProposals = async() =>
  {
    // WEB3 to get proposals here
      setDAO_Info({...DAO_Info, proposals: DummyDAO.proposals})
  }

  const getDAO_Info = async () =>
  {
    let info = await Axios.get("/dao/" + addr);
    setDAO_Info(info.data);
    await fetchProposals();
  }

  useState(() =>
  {
    getDAO_Info();
  }, [])
  */

  return (
    <Container>
      <DAOName>{DummyDAO.name} | {DummyDAO.symbol}</DAOName>
      <TopRow>
        <TopButton> Transfer tokens</TopButton>  
        <TopButton> New Proposal </TopButton> 
      </TopRow>
      <RowName> Open </RowName>
      <ProposalRow>
          {Object.keys(DummyDAO.proposals).map((key, i) =>
            DummyDAO.proposals[key].status &&
            <ProposalCard key={i}>
              <ProposalTitle> #{i} | {DummyDAO.proposals[key].title} </ProposalTitle>
              <ProposalText numberOfLines={1}>{DummyDAO.proposals[key].text}</ProposalText>
              <VoteCol>
                <VoteTextRow>
                  <VoteText>yes : {(DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount} %</VoteText>
                  <VoteText>no : {100 - ((DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount)} %</VoteText>
                </VoteTextRow>
                <VoteBar 
                  yes = {(DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount}
                  no = {100 - ((DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount)}
                />
                <VoteRow>
                  <VoteButton color="green">YES</VoteButton>
                  <VoteButton color="red">NO</VoteButton>
                </VoteRow>
              </VoteCol>
            </ProposalCard>
            )
          }
      </ProposalRow>
      <Divider/>
      <RowName> Closed </RowName>
      <ProposalRow>
          {Object.keys(DummyDAO.proposals).map((key, i) =>
            !DummyDAO.proposals[key].status &&
            <ProposalCard key={i}>
              <ProposalTitle> #{i} | {DummyDAO.proposals[key].title} </ProposalTitle>
              <ProposalText numberOfLines={1}>{DummyDAO.proposals[key].text}</ProposalText>
              <VoteCol>
                <VoteTextRow>
                  <VoteText>yes : {(DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount} %</VoteText>
                  <VoteText>no : {100 - ((DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount)} %</VoteText>
                </VoteTextRow>
                <VoteBar 
                  yes = {(DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount}
                  no = {100 - ((DummyDAO.proposals[key].voteTotal * 100) / DummyDAO.proposals[key].voteCount)}
                />
              </VoteCol>
            </ProposalCard>
            )
          }
      </ProposalRow>
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