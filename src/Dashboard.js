import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";

const PINATA_API_KEY = "63e2ac6cff8552b8e639";
const PINATA_SECRET_KEY = "33a4467dc5d630d409da18b1ad0d7adb49a6b4ba42e66e749c1e4f5ce8b3ac11";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #121212;
  color: white;
  position: relative;
`;

const TopBar = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserID = styled.p`
  background: #222;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
`;

const Button = styled.button`
  background: ${(props) => (props.danger ? "#ff4444" : "#ff9900")};
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: 0.3s;

  &:hover {
    background: ${(props) => (props.danger ? "#cc0000" : "#e68a00")};
  }
`;

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 20px;
  background: #222;
  border-radius: 12px;
`;

const Input = styled.input`
  display: none;
`;

const Label = styled.label`
  background: #ff9900;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  &:hover {
    background: #e68a00;
  }
`;

const FileName = styled.p`
  font-size: 14px;
  color: #ddd;
`;

export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const address = localStorage.getItem("walletAddress");
    if (!address) navigate("/"); // Redirect if not connected
    setWalletAddress(address);
  }, [navigate]);

  function disconnectWallet() {
    localStorage.removeItem("walletAddress");
    setWalletAddress("");
    navigate("/");
  }

  function handleFileChange(event) {
    const file = event.target.files[0];
    if (file && file.type === "audio/mpeg") {
      setSelectedFile(file);
    } else {
      alert("Please select a valid MP3 file.");
    }
  }
  
  async function handleUpload(selectedFile) {
    if (!selectedFile) {
      alert("No file selected!");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
  
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
          },
        }
      );
  
      console.log("Uploaded to IPFS:", `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
      alert("Music uploaded successfully! IPFS URL: " + `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    }
  }
  
  

  return (
    <Container>
      <TopBar>
        {walletAddress && <UserID>{walletAddress}</UserID>}
        <Button danger onClick={disconnectWallet}>Disconnect</Button>
      </TopBar>
      
      <h1>🎵 Dashboard</h1>

      <UploadContainer>
        <Input type="file" id="fileInput" accept="audio/mpeg" onChange={handleFileChange} />
        <Label htmlFor="fileInput">Choose MP3 File</Label>
        {selectedFile && <FileName>📁 {selectedFile.name}</FileName>}
        <Button onClick={() => handleUpload(selectedFile)}>Upload</Button>

      </UploadContainer>
    </Container>
  );
}
