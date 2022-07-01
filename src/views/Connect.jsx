import Axios from "axios";
import React, { useState, useRef } from "react";
import styled from "styled-components";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';

export const Connect = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    return <WalletDialogButton>Connect</WalletDialogButton>
}