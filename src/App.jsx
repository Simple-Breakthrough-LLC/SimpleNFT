import { useMemo } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import ModalsProvider from "./contexts/Modals";

import { clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';

import BaseView from "./components/BaseView";
import { Home } from "./views/Home";
import { ViewContract } from "./views/ViewContract";
import { CreateCandyMachine } from "./views/CreateCandyMachine.jsx";

const App = () => {
  return (
    <Providers>
      <BaseView>
        <Router>
          <Switch>
            <Route path="/" exact>
              <Home />
            </Route>
            <Route path="/view_contract" exact>
              <ViewContract />
            </Route>
            <Route path="/new" exact>
              <CreateCandyMachine />
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
          <ModalsProvider>{children}</ModalsProvider>;
        </WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
};

export default App;
