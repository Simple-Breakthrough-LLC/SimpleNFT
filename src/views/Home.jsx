import Axios from "axios";
import React, { useState, useRef, useEffect } from "react";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createCandyMachine } from '../web3/utils.js';
import styled from "styled-components";

import { ViewContract } from "./ViewContract";

import uploadImg from "../assets/UploadImage.svg";

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
    description: "",
    image: ""
    // saleRecipient: "",
    // royaltyRecipient: "",
    // percentage: 0,
  });

  const create = async (name, symbol, uri) => {
    const candyMachine = await createCandyMachine(wallet, connection, {
      symbol: symbol,
      hiddenSettings: {
        name: name,
        uri: "http://localhost:5000/contract/get/" + uri,
        hash: "80a7b27fb7c83f4178bbedc1e2a3a506",
      },
    });
    if (candyMachine.err) {
      throw new Error(candyMachine.err)
      return;
    }
    console.log('candy machine:', candyMachine.candyMachine.toBase58())
    console.log('collection mint:', candyMachine.collectionMint.toBase58())
    return candyMachine.candyMachine.toBase58();
  }

  // const loadImage = async (e) => {
  //   if (e.target.files.length) {
  //     try {
  //       const url = URL.createObjectURL(e.target.files[0]);
  //       setImageUrl(url);
  //       setImage(e.target.files[0]);
  //     } catch (err) {
  //       console.log("error on file input", err);
  //     }
  //   }
  // };

  const findContracts = async() =>{
    let data = await Axios.get("/user/get/" + wallet.publicKey.toBase58())
    console.log(data.data)
    if (data.data.length)
      setContract(data.data[0]);
  }

  const Submit = async(e, name) => {
    // Await server image & data creation
    try {

      Axios.post("/contract/new", {fields, user: wallet.publicKey.toBase58()})
      .then(async (res) =>{
        let addr = await create(fields.name, fields.symbol, res.data.contract);
        console.log("Created contract", res.data);
        Axios.post("/contract/update", {fields: {addr}, user: wallet.publicKey.toBase58(), id: res.data.contract})
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
  
  };

  useEffect(() =>
  {
    console.log("Hi")
    findContracts();
  }, [])

  if (contract)
    return (<ViewContract contract={contract}/>)
  return (

    <Container>
      <FlexColumn>
        <Top>
          <Title>
            <TitleText>General </TitleText>
            <SubText>sub-text here</SubText>
          </Title>
          <FlexColumn2>
            <FlexRow>
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
            </FlexRow>
            <PayoutRecipientInput>
                <InputText>Image</InputText>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormFields({ ...fields, image: e.target.value })
                  }
                />
              </PayoutRecipientInput>
            <DescriptionInput>
              <InputText>Description</InputText>
              <InputArea
                onChange={(e) =>
                  setFormFields({ ...fields, description: e.target.value })
                }
              />
            </DescriptionInput>
            {/* <ImageInput>
              <InputText>Image</InputText>
              <WhiteFlexRow onClick={() => fileInput.current.click()}>
                <NftImage src={imageUrl} />
              </WhiteFlexRow>
              <input
                type="file"
                name="image"
                onChange={(e) => loadImage(e)}
                ref={fileInput}
                style={{ display: `none` }}
                accept=".png, .jpeg, .svg, .gif"
                required
              />
            </ImageInput> */}
          </FlexColumn2>
        </Top>
        {/* <Bottom>
          <BottomTitle>
            <TitleText>Payout Settings</TitleText>
            <SubText>sub-text here</SubText>
          </BottomTitle>
          <SubTitle>Primary Sales</SubTitle>
          <PayoutRecipientInput>
            <InputText>Recipient Address</InputText>
            <Input
              placeholder="0x7c90cde29F475C3d9687c981dBaC47D344CbDa6d"
              type="text"
              onChange={(e) =>
                setFormFields({ ...fields, saleRecipient: e.target.value })
              }
            />
          </PayoutRecipientInput>
          <SubTitle>Royalties</SubTitle>
          <FlexRow>
            <RoyaltiesRecipientInput>
              <InputText>Recipient Address</InputText>
              <Input
                type="text"
                onChange={(e) =>
                  setFormFields({
                    ...fields,
                    royaltyRecipient: e.target.value,
                  })
                }
              />
            </RoyaltiesRecipientInput>
            <PercentageInput>
              <SeparateRow>
                <InputText>Percentage</InputText>
                <PercentageText>%</PercentageText>
              </SeparateRow>
              <Input
                type="number"
                max={100}
                min={0}
                value={formFields.percentage}
                onChange={(e) => {
                  if (e.target.value >= 0 && e.target.value <= 100) {
                    setFormFields({
                      ...fields,
                      percentage: e.target.value,
                    });
                  }
                }}
              />
            </PercentageInput>
          </FlexRow>
        </Bottom> */}
      </FlexColumn>
      <DeployButton onClick={(e) => Submit(e, "RedOrangeText")}>
        Deploy
      </DeployButton>
    </Container>
  );
};
const Container = styled.div`
  display: flex;
  overflow-y: scroll;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: flex-start;
  gap: 10px;
  padding: 60px 80px 48px 80px;
  left: 10%;
  position: relative;

  input {
    box-sizing: border-box;
  }
`;

const NftImage = styled.img`
  display: flex;
  max-height: 300px;
`;

const PercentageText = styled.div`
  font-size: 14px;
  font-family: Spartan;
  font-weight: 500;
`;

const SeparateRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;
const TitleText = styled.div`
  font-size: 24px;
  font-family: Spartan;
  font-weight: 700;
  color: #06005b;
`;
const SubText = styled.div`
  font-size: 14px;
  font-family: Spartan;
  font-weight: 500;
`;
const FlexColumn2 = styled.div`
  display: flex;
  align-self: center;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
`;
const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 40px;
  justify-content: center;
  align-items: center;
  width: 100%;
`;
const NameInput = styled.div`
  width: 70%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const PayoutRecipientInput = styled.div`
  width: 100%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const RoyaltiesRecipientInput = styled.div`
  width: 70%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const PercentageInput = styled.div`
  width: 30%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;

const SymbolInput = styled.div`
  width: 30%;
  display: flex;
  height: 74px;
  position: relative;
  justify-content: flex-start;
  flex-direction: column;
`;
const DescriptionInput = styled.div`
  width: 100%;
  height: 111px;
  position: relative;
`;

const ImageInput = styled.div`
  width: 100%;
  position: relative;
`;
const WhiteFlexRow = styled.div`
  border-width: 1px;
  border-color: #aaaaaa;
  border-style: solid;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  padding: 15px 0px;
  // background-image: url(${uploadImg})
`;

const Bottom = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 15px;
  width: 100%;
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

const BottomTitle = styled.div`
  display: flex;
  align-self: flex-start;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  align-items: flex-start;
  margin: 0px 0px 33px 0px;
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
  align-items: flex-start;
  gap: 64px;
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

const InputArea = styled.textarea`
  border: 1px solid #aaaaaa;
  height: 48px;
  background-color: #ffffff;
  border-radius: 10px;
  width: 100%;
  padding-left: 10px;
  font-size: 17px;
  width: 618px;
  height: 85px;
`;
const SubTitle = styled.div`
  font-size: 16px;
  font-family: Spartan;
  font-weight: 700;
  color: #06005b;
`;
