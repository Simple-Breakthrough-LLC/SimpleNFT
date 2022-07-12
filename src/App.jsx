import { useMemo } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';

import BaseView from "./components/BaseView";
import { Home } from "./views/Home";

const App = () => {
  return (
    <Providers>
      <BaseView>
        <Router>
          <Switch>
            <Route path="/" exact>
              <Home />
            </Route>
          </Switch>
        </Router>
      </BaseView>
    </Providers>
  );
};

const Providers = ({ children }) => {
    const network = process.env.REACT_APP_SOLANA_NETWORK;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
        ],
        [network],
    );

    return <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletDialogProvider>
          {children}
        </WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
};

export default App;
