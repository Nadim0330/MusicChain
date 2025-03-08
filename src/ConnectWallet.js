import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #121212;
  color: white;
`;

const Button = styled.button`
  background: #ff9900;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 8px;
  transition: 0.3s;
  margin-top: 10px;

  &:hover {
    background: #e68a00;
  }
`;

let web3Modal;

export default function ConnectWallet() {
  const [walletAddress, setWalletAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    web3Modal = new Web3Modal({
      cacheProvider: false, // 🟢 Ensure Web3Modal doesn't auto-reconnect
    });
  }, []);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected!");
        return;
      }
  
      // Force MetaMask to manually ask for permission
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
  
      const provider = await web3Modal.connect();
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
  
      // Check and switch to Sepolia
      const network = await ethersProvider.getNetwork();
      if (network.chainId !== 11155111n) { // Sepolia Chain ID
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xAA36A7" }], // Sepolia in hex
        });
        alert("Switched to Sepolia, please reconnect.");
        return;
      }
  
      setWalletAddress(address);
      localStorage.setItem("walletAddress", address);
      navigate("/dashboard");
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  }
  

  async function disconnectWallet() {
    localStorage.removeItem("walletAddress");
    setWalletAddress("");

    if (web3Modal) {
      await web3Modal.clearCachedProvider(); // 🟢 Ensure Web3Modal resets
    }

    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        console.log("MetaMask revoke permission not supported:", error);
      }
    }

    web3Modal = new Web3Modal({
      cacheProvider: false, // 🟢 Ensure fresh session
    });

    navigate("/");
  }

  return (
    <Container>
      <h1>🎵 Web3 Social Music</h1>
      <Button onClick={connectWallet}>Connect Wallet</Button>
    </Container>
  );
}
