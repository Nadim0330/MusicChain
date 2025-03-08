const hre = require("hardhat");

async function main() {
    const MusicDApp = await hre.ethers.getContractFactory("MusicDApp");
    const musicDApp = await MusicDApp.deploy();

    await musicDApp.waitForDeployment(); // ✅ Fix: Use waitForDeployment() instead of deployed()

    console.log("MusicDApp deployed to:", await musicDApp.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
