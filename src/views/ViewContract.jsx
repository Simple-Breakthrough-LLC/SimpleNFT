import React, { useState } from "react";
import styled from "styled-components";

import { ReactComponent as CopyIcon } from "../assets/copy-solid.svg";

export const ViewContract = ({contract}) => {
  const [formFields, setFormFields] = useState({
    name: "testtest",
    symbol: "test",
    description: "some description here",
    image:"",
    // saleRecipient: "",
    // royaltyRecipient: "",
    // percentage: 0,
  });

  const mint = async () =>
  {

  }

  return (
    <Container>
      <FlexColumn>
        <Top>
          <Title>
            <TitleText>Preview contract</TitleText>
          </Title>
        </Top>
        <Mid>
          <Divider />
          <FlexRow>
            <InputText>Token address</InputText>
            <Row>
              <Text>{contract.contract.addr}</Text>
              <CopyIcon style={{ height: "15px" }} />
            </Row>
          </FlexRow>
          <Divider />
          <FlexRow>
            <InputText>Desciption</InputText>
            <Row>
              <Text>{contract.contract.description}</Text>
            </Row>
            <img src={contract.contract.image}/>
          </FlexRow>
          <Divider />
          <FlexRow>
            <Row>
              <Item>
                <InputText>Token name:</InputText>
                <Text>{contract.contract.name}</Text>
              </Item>
              <Item>
                <InputText>Token symbol:</InputText>
                <Text>{contract.contract.symbol}</Text>
              </Item>
            </Row>
            <Item>
              <InputText>Decimals:</InputText>
              <Text>0</Text>
            </Item>
          </FlexRow>
          <Divider />
          <FlexRow>
            <Item>
              <InputText>Token owner:</InputText>
              <Row>
                <Text>{contract.addr}</Text>
                <CopyIcon style={{ height: "15px" }} />
              </Row>
            </Item>
          </FlexRow>
          <Divider />
        </Mid>
      </FlexColumn>
      <DeployButton onClick={mint}>MINT</DeployButton>
    </Container>
  );
};

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
const Container = styled.div`
  display: flex;
  overflow-y: scroll;
  flex-direction: row;
  justify-content: center;
  padding-top: 60px;
  gap: 30px;

  align-items: end
  input {
    box-sizing: border-box;
  }
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const FlexRow = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 10px;
`;

const Divider = styled.div`
  width: 100%;
  border-top: 1px solid lightgrey;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 30px;

  svg {
    :hover {
      cursor: pointer;
    }
  }
`;

const Item = styled.div`
  display: flex;
  flex-direction: column;
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

const Mid = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
`;

const TitleText = styled.div`
  font-size: 24px;
  font-family: Spartan;
  font-weight: 700;
  color: #06005b;
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

const InputText = styled.div`
  font-size: 14px;
  font-family: Spartan;
  font-weight: 500;
  width: 100%;
  padding-bottom: 5px;
`;

const Text = styled.div`
  font-family: Spartan;
  font-style: normal;
  font-weight: 300;
  font-size: 12px;
  line-height: 13px;
  color: #000000;
`;
