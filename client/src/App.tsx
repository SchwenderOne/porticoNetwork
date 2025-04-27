import { Switch, Route } from "wouter";
import NetworkPage from "./pages/NetworkPage";
import ContactsPage from "./pages/ContactsPage";
import NetworkFullScreen from "./pages/NetworkFullScreen";
import NotFound from "./pages/not-found";
import Header from "./components/Header";
import SettingsPage from "./pages/SettingsPage";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Switch>
        <Route path="/" component={NetworkPage} />
        <Route path="/network" component={NetworkFullScreen} />
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

export default App;
