// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MusicDApp {
    struct Song {
        string title;
        string caption;
        string ipfsHash;
        address owner;
        uint likes;
    }

    Song[] public songs;
    mapping(string => bool) private songExists; // Avoid duplicate uploads
    mapping(address => mapping(uint => bool)) private likedSongs; // Track user likes

    event SongUploaded(string title, string ipfsHash, address owner);
    event SongLiked(uint songId, uint likes);

    function uploadSong(string memory _title, string memory _caption, string memory _ipfsHash) public {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_caption).length > 0, "Caption is required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash is required");
        require(!songExists[_ipfsHash], "Song already uploaded");

        songs.push(Song(_title, _caption, _ipfsHash, msg.sender, 0));
        songExists[_ipfsHash] = true;

        emit SongUploaded(_title, _ipfsHash, msg.sender);
    }

    function likeSong(uint _songId) public {
        require(_songId < songs.length, "Invalid song ID");
        require(!likedSongs[msg.sender][_songId], "Already liked");

        songs[_songId].likes++;
        likedSongs[msg.sender][_songId] = true;

        emit SongLiked(_songId, songs[_songId].likes);
    }

    function getAllSongs() public view returns (Song[] memory) {
        return songs;
    }
}
