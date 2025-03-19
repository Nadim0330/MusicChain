import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { ethers } from "ethers";
import html2pdf from "html2pdf.js";
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
`;const MainContent = styled.div`
display: flex;
width: 90%;
height: 80vh;
gap: 20px;
`;

const Feed = styled.div`
flex: 7;
background: #1a1a1a;
padding: 20px;
border-radius: 12px;
overflow-y: auto;
`;

const UserPanel = styled.div`
flex: 3;
background: #222;
padding: 20px;
border-radius: 12px;
display: flex;
flex-direction: column;
align-items: center;
`;

const SongCard = styled.div`
display: flex;
align-items: center;
justify-content: space-between;
background: #292929;
padding: 10px 15px;
margin-bottom: 10px;
border-radius: 10px;
width: 90%;
min-height: 30px;
transition: 0.3s;
box-shadow: 2px 2px 10px rgba(255, 255, 255, 0.1);

&:hover {
  background: #333;
}
`;

const SongInfo = styled.div`
display: flex;
flex-direction: column;
gap: 3px;
color: #fff;
font-size: 14px;
`;

const Controls = styled.div`
display: flex;
align-items: center;
gap: 10px;
`;

const LikeButton = styled.button`
background: none;
border: none;
color: #ff9900;
font-size: 16px;
cursor: pointer;
transition: 0.3s;

&:hover {
  color: #e68a00;
}
`;


export default function Dashboard() {
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const navigate = useNavigate();
//fetch songs
const [songs, setSongs] = useState([]);
const [musicUrls, setMusicUrls] = useState({}); // 🔸 Track each song's MP3 URL

async function getMusicFileUrl(ipfsHash) {
  try {
    const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
    return res.data.musicFile;  // ✅ Extract MP3 URL from JSON
  } catch (error) {
    console.error("Error fetching music file URL:", error);
    return null;
  }
}
function generateCertificate(song, txHash, timestamp) {
  const formattedTime = new Date(timestamp).toLocaleString();

  const certificateDiv = document.createElement("div");
  certificateDiv.innerHTML = `
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 30px; border: 8px solid #ff9900; border-radius: 15px; font-family: 'Georgia', serif; background-color: #fdfaf6; color: #333; text-align: center;">
      <h1 style="font-size: 28px; margin-bottom: 10px;">Certificate of Ownership</h1>
      <p style="font-size: 16px; margin-bottom: 25px;">
        This certifies that the following song has been successfully uploaded to the blockchain.
      </p>
      <div style="text-align: left; margin: 0 auto; width: 90%; font-size: 14px; line-height: 1.6;">
        <p><strong>Title:</strong> ${song.title}</p>
        <p><strong>Caption:</strong> ${song.caption}</p>
        <p><strong>Music File:</strong> <a href="${song.musicUrl}" target="_blank">${song.musicUrl}</a></p>
        <p><strong>Owner Wallet:</strong> ${song.owner}</p>
        <p><strong>Transaction Hash:</strong> ${txHash}</p>
        <p><strong>Timestamp:</strong> ${formattedTime}</p>
      </div>
      <p style="margin-top: 30px; font-style: italic; font-size: 12px;">
        Verified on blockchain. Ownership officially recorded.
      </p>
    </div>
  `;

  document.body.appendChild(certificateDiv);

  html2pdf().set({
    margin: [0.5, 0.5, 0.5, 0.5],  // Top, Left, Bottom, Right margins in inches
    filename: `${song.title}_Certificate.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all'] },
  }).from(certificateDiv).save().then(() => {
    certificateDiv.remove();
  });
}

useEffect(() => {
  async function fetchAllMusicUrls() {
    const urls = {};
    for (const song of songs) {
      const url = await getMusicFileUrl(song.ipfsHash);
      urls[song.id] = url;  // 🎯 Map song ID to its MP3 URL
    }
    setMusicUrls(urls);
  }

  if (songs.length > 0) fetchAllMusicUrls();
}, [songs]);

useEffect(() => {
  async function fetchSongs() {
    try {
      const contract = await getContract();
      if (!contract) return alert("Wallet not connected!");

      const fetchedSongs = await contract.getAllSongs();
      const formattedSongs = fetchedSongs
        .map((song, index) => ({
          id: index,
          title: song.title,
          caption: song.caption,
          ipfsHash: song.ipfsHash,
          owner: song.owner,
          likes: Number(song.likes),
        }))
        .reverse(); // 🔄 Show most recent first

      setSongs(formattedSongs);
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  }
  fetchSongs();
}, []);
async function likeSong(songId) {
  try {
    const contract = await getContract();
    if (!contract) return alert("Wallet not connected!");

    const tx = await contract.likeSong(songId);
    await tx.wait();

    alert("Liked song successfully!");
    setSongs((prevSongs) =>
      prevSongs.map((song) =>
        song.id === songId ? { ...song, likes: song.likes + 1 } : song
      )
    );
  } catch (error) {
    console.error("Error liking song:", error);
    alert("Failed to like song.");
  }
}
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
console.log("Transaction sent! Hash:", tx.hash);

await tx.wait(); // Wait for confirmation
const txDate = new Date().toLocaleString();
generateCertificate({
  title,
  caption,
  musicUrl: fileIpfsUrl,
  owner: walletAddress
}, tx.hash, Date.now());
;

console.log("Transaction confirmed:", tx.hash);

alert(`Song uploaded to blockchain! \nTransaction ID: ${tx.hash}\n\nView on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

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

    <MainContent>
      {/* Left Side (Feed - 70%) */}
      <Feed>
        <h2>🎶 Music Feed</h2>
        {songs.length === 0 ? (
          <p>No songs uploaded yet.</p>
        ) : (
          songs.map((song) => (
            <SongCard key={song.id}>
              <SongInfo>
                <h3>{song.title}</h3>
                <p>{song.caption}</p>
                <p>🎤 {song.owner.slice(0, 6)}...{song.owner.slice(-4)}</p>
              </SongInfo>
              <Controls>
              {musicUrls[song.id] ? (
  <audio controls src={musicUrls[song.id]} />
) : (
  <p>Loading audio...</p>
)}

                <LikeButton onClick={() => likeSong(song.id)}>👍 {song.likes}</LikeButton>
              </Controls>
            </SongCard>
          ))
        )}
      </Feed>

      {/* Right Side (User Uploads - 30%) */}
      <UserPanel>
        <h2>📤 Your Uploads</h2>
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
      </UserPanel>
    </MainContent>
  </Container>
);


}
