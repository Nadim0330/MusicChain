import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConnectWallet from "./ConnectWallet";
import Dashboard from "./Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConnectWallet />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
