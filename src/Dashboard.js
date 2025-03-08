import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { ethers } from "ethers";
import { getContract } from "./utils/contract"; // ✅ Correct import


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

const TextInput = styled.input`
  padding: 10px;
  width: 80%;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  background: #333;
  color: white;
`;

export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
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

  async function uploadToPinata() {
    const contract = await getContract(); // Add await here

    if (!contract) {
        alert("Wallet not connected!");
        return;
    }
    console.log("Contract instance:", contract);
    console.log("Available functions:", Object.keys(contract));


    if (!selectedFile || !title || !caption) {
        alert("Please fill all fields before uploading!");
        return;
    }

    try {
        const formData = new FormData();
        const mp3FileName = `${title}.mp3`;  
        formData.append("file", selectedFile);

        const fileMetadata = JSON.stringify({ name: mp3FileName });
        formData.append("pinataMetadata", fileMetadata);

        // 🔹 Upload MP3 to Pinata
        const fileResponse = await axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            formData,
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                },
            }
        );

        const fileIpfsUrl = `https://gateway.pinata.cloud/ipfs/${fileResponse.data.IpfsHash}`;

        // 🔹 Upload JSON metadata
        const jsonMetadata = {
            pinataMetadata: { name: `${title}.json` },
            pinataContent: {
                title: title,
                caption: caption,
                musicFile: fileIpfsUrl,
                owner: walletAddress,
            },
        };

        const jsonResponse = await axios.post(
            "https://api.pinata.cloud/pinning/pinJSONToIPFS",
            jsonMetadata,
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY,
                    "Content-Type": "application/json",
                },
            }
        );

        const metadataHash = jsonResponse.data.IpfsHash;
        console.log("Metadata Hash:", metadataHash); // ✅ Check if it's valid

        alert("Upload successful! Now uploading to blockchain...");

        // 🔹 Upload to Blockchain
        try {
            const tx = await contract.uploadSong(title, caption, metadataHash);
            await tx.wait();
            alert("Song uploaded to blockchain!");
        } catch (error) {
            console.error("Blockchain upload failed:", error);
            alert("Failed to upload song on blockchain. Check console for details.");
        }
    } catch (error) {
        console.error("Pinata upload failed:", error);
        alert("Upload to Pinata failed. Please try again.");
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

        <TextInput
          type="text"
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <TextInput
          type="text"
          placeholder="Enter caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <Button onClick={uploadToPinata}>Upload</Button>
      </UploadContainer>
    </Container>
  );
}
