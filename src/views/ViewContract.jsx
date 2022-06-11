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
    </Container>
  );
};

const Container = styled.div`
  background-color: #f9f9f9;
  display: flex;
  overflow: hidden;
  flex-direction: row;
  justify-content: space-evenly;
  padding-top: 60px;
  gap: 10px;

  input {
    box-sizing: border-box;
  }
`;

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 50%;
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
