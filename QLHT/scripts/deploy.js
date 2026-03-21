const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const Factory = await ethers.getContractFactory("StudentStartupFund");
  console.log("Deploying StudentStartupFund...");

  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("StudentStartupFund deployed to:", address);

  // Tự động cập nhật frontend .env
  const envPath = path.join(__dirname, "../../frontend/.env");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
    // Comment out tất cả dòng VITE_STUDENT_FUND_ADDRESS cũ
    envContent = envContent.replace(
      /^(VITE_STUDENT_FUND_ADDRESS=.+)$/gm,
      "# $1"
    );
  }
  envContent += `\nVITE_STUDENT_FUND_ADDRESS=${address}\n`;
  fs.writeFileSync(envPath, envContent);
  console.log("Updated frontend/.env with new address:", address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
