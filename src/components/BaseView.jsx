import React from "react";
import styled from "styled-components";

import { useWallet } from '@solana/wallet-adapter-react';
import { Connect } from "../views/Connect";

export const BaseView = ({ children }) => {
  const wallet = useWallet();
  
  return (
        <Content>
          {wallet.connected 
          ? children
          : <Connect/>
          }
        </Content>
  );
};

export default BaseView




const Content = styled.div`
  display:flex;
  background-color: #f9f9f9;
  display: flex;
  overflow: hidden;
  flex-direction: column;
`
