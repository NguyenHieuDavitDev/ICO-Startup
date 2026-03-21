import { ethers } from "ethers";
import StudentStartupFund from "./abi/StudentStartupFund.json";

// Địa chỉ contract — lấy từ .env hoặc fallback sang giá trị cứng
const CONTRACT_ADDRESS =
  import.meta.env.VITE_STUDENT_FUND_ADDRESS;

const ABI = StudentStartupFund.abi;

// RPC công cộng cho Sepolia — dùng khi chỉ đọc (không cần MetaMask)
const SEPOLIA_RPC = "https://rpc.sepolia.org";

export async function getContract(readonly = false) {
  // dùng để đọc dữ liệu từ contract. Nếu readonly là true thì dùng để đọc dữ liệu từ contract.
  if (readonly) {
    // Ưu tiên dùng MetaMask provider
    try {
      if (window.ethereum) { // nếu window.ethereum có tồn tại thì dùng MetaMask provider
        const provider = new ethers.BrowserProvider(window.ethereum); // Đọc dữ liệu từ contract bằng MetaMask. BrowserProvider là một provider đọc dữ liệu từ browser. window.ethereum là ví MetaMask.
        return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider); // Trả về contract đọc dữ liệu bằng MetaMask. CONTRACT_ADDRESS là địa chỉ contract, ABI là bản mô tả của contract, provider là đọc dữ liệu từ contract.
      }
    } catch (error) {  
      console.log("Error reading contract data:", error);
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC); // Đọc dữ liệu từ contract JsonRpcProvider là một provider đọc dữ liệu từ RPC công cộng
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider); // Trả về contract đọc dữ liệu bằng JsonRpcProvider
  }

  // Ghi dữ liệu cần bắt buộc phải có MetaMask. Nếu không có MetaMask thì throw error.
  if (!window.ethereum) {
    throw new Error("Vui lòng cài MetaMask để thực hiện giao dịch");
  }

  // dùng để ghi dữ liệu vào contract. Nếu readonly là false thì dùng để ghi dữ liệu vào contract.
  const provider = new ethers.BrowserProvider(window.ethereum); // BrowserProvider là một provider đọc dữ liệu từ browser. window.ethereum là ví MetaMask.
  await provider.send("eth_requestAccounts", []); // Gửi request để lấy địa chỉ ví MetaMask. eth_requestAccounts là một request để lấy địa chỉ ví MetaMask.
  const signer = await provider.getSigner(); // Lấy signer từ provider. Signer là một signer đọc dữ liệu từ contract. getSigner là một hàm để lấy signer từ provider.
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);  // gọi smart contract bằng signer để thực hiện giao dịch.
  // Trả về contract đọc dữ liệu bằng signer. CONTRACT_ADDRESS là địa chỉ contract, ABI là bản mô tả của contract, signer là signer đọc dữ liệu từ contract.
}
