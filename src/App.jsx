import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import ModalsProvider from "./contexts/Modals";

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
  return (
    <ModalsProvider>
      {children}
    </ModalsProvider>
  );
};

export default App;
