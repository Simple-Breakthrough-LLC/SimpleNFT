import Axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createBasicDAOInstructions, daoStep1 } from '../web3/governance';
import styled from "styled-components";

import { ViewContract } from "./ViewDAO";

import { Keypair, PublicKey } from '@solana/web3.js';
import { getPDA, sendAndConfirmInstructions } from '../web3/utils.js';
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const Home = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [contract, setContract] = useState(null)
  // const [imageUrl, setImageUrl] = useState(uploadImg);
  const [image, setImage] = useState(null);
  // const fileInput = useRef(null);
  const [fields, setFormFields] = useState({
    name: "",
    symbol: "",
    amount: 0
  });

  const Submit = async(e, name) => {
	// TODO Using Math.random as a name because I can't be bothered to type a unique one each time
	const { realmPDA, tx } = await daoStep1(wallet, connection, "Name " + Math.random());
	console.log('Now redirect to /dao/' + realmPDA.publicKey.toBase58())
	/*
    console.log("Submitted")
    try {
      // Unsafe, would need to get signature & check it 
      Axios.post("/dao/new", {fields})
      .then(async (res) =>{
        let addr = await create(fields.name, fields.symbol, res.data.contract);
        console.log("Created contract", res.data);
        Axios.post("/dao/update", {fields: {addr}, id: res.data.contract})
        .then(async (res) =>
        {
          console.log("Updated contract", res.data)
          findContracts();//TODO
        })
      })
    }
    catch(err)
    {
      console.log("This happenned", err)
    }
	*/
  
  };

  return (

    <Container>
      <FlexColumn>
        <Top>
          <Title>
            <TitleText>NEW DAO </TitleText>
          </Title>
          <FlexColumn2>
              <NameInput>
                <InputText>Name</InputText>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormFields({ ...fields, name: e.target.value })
                  }
                />
              </NameInput>
              <SymbolInput>
                <InputText>Symbol</InputText>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormFields({ ...fields, symbol: e.target.value })
                  }
                />
              </SymbolInput>
            <TokenAmount>
                <InputText>Token Amount</InputText>
                <Input
                  type="number"
                  max={100}
                  min={0}
                  value={fields.amount}
                  onChange={(e) => {
                    if (e.target.value >= 0 && e.target.value <= 100) {
                      setFormFields({
                        ...fields,
                        amount: e.target.value,
                      });
                    }
                  }}
                />
              </TokenAmount>
          </FlexColumn2>
        </Top>

      <DeployButton onClick={(e) => Submit(e, "RedOrangeText")}>
        Deploy
      </DeployButton>
      </FlexColumn>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  overflow-y: scroll;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: relative;
  input {
    box-sizing: border-box;
  }
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const TitleText = styled.div`
  font-size: 24px;
  font-family: Spartan;
  font-weight: 700;
  color: #06005b;
`;
const FlexColumn2 = styled.div`
  display: flex;
  align-self: center;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: center;
`;

const NameInput = styled.div`
  width: 100%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const TokenAmount = styled.div`
  width: 46%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const SymbolInput = styled.div`
  width: 42%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const Title = styled.div`
  display: flex;
  align-self: flex-start;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: flex-start;
  margin: 0px 0px 48px 0px;
`;


const DeployButton = styled.button`
  display: flex;
  font-size: 16px;
  font-family: Spartan;
  font-weight: 700;
  color: #ffffff;
  width: 125px;
  height: 18px;
  background-color: #ed3723;
  overflow: hidden;
  border-radius: 10px;
  padding: 17px 0px 15px 0px;
  border-width: 0px;
  box-sizing: content-box;
  cursor: pointer;
  justify-content: center;
  align-self: self-end;
  bottom: 6px;
  position: relative;
  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.3);
  }
`;
const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 55px;
  padding: 30px 60px;
  border: 1px solid grey;
  border-radius: 10px;
`;
const InputText = styled.div`
  font-size: 14px;
  font-family: Spartan;
  font-weight: 500;
  width: 100%;
  padding-bottom: 5px;
`;
const Input = styled.input`
  border: 1px solid #aaaaaa;
  height: 48px;
  background-color: #ffffff;
  border-radius: 10px;
  width: 100%;
  padding-left: 10px;
  font-size: 17px;
`;
