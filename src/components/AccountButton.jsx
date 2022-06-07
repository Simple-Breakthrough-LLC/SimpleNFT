import React, { useCallback } from "react";
import ReactGA from "react-ga";
import styled from "styled-components";
import { useWallet } from "use-wallet";
import isMobile from "../../../utils/isMobile";

const AccountButton = ({noBG}) => {

  const { account, connect } = useWallet();

  const handleUnlockClick = useCallback(() => {
    if (isMobile()) {
      // connect('injected');
      connect("walletconnect");
    } else {
      connect("injected");
      // onPresentWalletProviderModal()
    }
  }, [connect]);

  if (account) {
    ReactGA.set({
      userId: account,
      // any data that is relevant to the user session
      // that you would like to track with google analytics
    });
  }

  return (
    <StyledAccountButton>
     
      {!account ? (
        <Button
          noBG={noBG}
          disabled={false}
          style={{ marginTop: "2px" }}
          // onClick={handleUnlockClick}
        >
          Connect
        </Button>
      ) : (
        <StyledAccountInfo>
          <Oval />
          {isMobile() ? (
            <StyledA
              href={`https://etherscan.io/address/${account}`}
              target={`_blank`}
              style={{ marginLeft: "-5px" }}
            >
              <div>{account.substring(0, 6)}</div>
              <div>{"..." + account.substring(account.length - 4)}</div>
            </StyledA>
          ) : (
            <StyledA
              href={`https://etherscan.io/address/${account}`}
              target={`_blank`}
            >
              {account.substring(0, 6) +
                "..." +
                account.substring(account.length - 4)}
            </StyledA>
          )}
        </StyledAccountInfo>
      )}
    </StyledAccountButton>
  );
};

const Button = styled.div`
  border: none;
  display:flex;
  text-align:center;
  justify-content:center;
  width:200px;
  height:65px;
  ${props => props.noBG && `padding-top: 10px;`}

  backgtound-size: fit;
  background-repeat: no-repeat;
  align-items: center;
  color: black;
  font-size: 18px;
  font-weight: 600;
  }
`;


const StyledAccountButton = styled.div`
  width: max-content;
  height: auto;
  position: relative
  background-size: contain;
 
  background-repeat: no-repeat;
  cursor: not-allowed;
  transition: all 0.1s linear;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  &:hover {
    opacity: 1;
  }
  @media only screen and (max-width: 767px) {
    background-size: 100% 100%;
    width: 100px;
    margin-left: -15px;
  }
`;

const Oval = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 5px;
  background-color: #7dca46;
  margin-right: 10px;
`;

const StyledAccountInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledA = styled.a`
  // font-family: "PlatNomor";
  font-size: 16px;
  color: white;
  line-height: 1;
  text-decoration: none !important;
  transition: all 0.1s linear;
  opacity: 0.85;
  margin-top: 2px;
  &:hover {
    opacity: 1;
  }
`;

export default AccountButton;
