import { Switch, Route } from "wouter";
import NetworkPage from "./pages/NetworkPage";
import NotFound from "./pages/not-found";
import Header from "./components/Header";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Switch>
        <Route path="/" component={NetworkPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
