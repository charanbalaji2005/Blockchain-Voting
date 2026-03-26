const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🗳️  Deploying DecentralizedVoting contract to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  const VotingFactory = await ethers.getContractFactory("DecentralizedVoting");
  const voting = await VotingFactory.deploy();
  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Contract deployed at:", contractAddress);

 const artifact = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../artifacts/contracts/Voting.sol/DecentralizedVoting.json"),
    "utf8"
  )
);

  const deployInfo = {
    address: contractAddress,
    abi: artifact.abi,
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Write to frontend
  fs.writeFileSync(
    path.join(__dirname, "../../frontend/src/utils/contract.json"),
    JSON.stringify(deployInfo, null, 2)
  );

  // Write to backend
  fs.writeFileSync(
    path.join(__dirname, "../../backend/core/contract.json"),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log("\n📄 ABI and address saved to frontend and backend.");
  console.log("\nVerify on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });