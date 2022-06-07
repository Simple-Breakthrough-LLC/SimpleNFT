import React from "react";
import styled from "styled-components";

export const BaseView = ({ children }) => {
  return (
        <Content>
          {children}
        </Content>
  );
};

export default BaseView




const Content = styled.div`
  height: 100%;
  display:flex;
  height: 100%;
  background-color: #f9f9f9;
  display: flex;
  overflow: hidden;
  flex-direction: column;
`
