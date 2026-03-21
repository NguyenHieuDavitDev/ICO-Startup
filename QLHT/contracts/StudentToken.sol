
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// contract StudentToken kế thừa từ ERC20, ERC20Capped, ERC20Burnable, Pausable, Ownable
// ERC20 là contract của token
// ERC20Capped là contract của token có số lượng token tối đa
// ERC20Burnable là contract của token có thể burn
// Pausable là contract của token có thể pause
// Ownable là contract của token có thể chỉ định owner 
contract StudentToken is
    ERC20, 
    ERC20Capped,
    ERC20Burnable,
    Pausable,
    Ownable
{
    constructor() // constructor của contract StudentToken
        ERC20("Student Startup Token", "SST") // gán tên của token là "Student Startup Token" và symbol là "SST"
        ERC20Capped(1_000_000 * 10 ** 18) // gán số lượng token tối đa là 1_000_000 * 10 ** 18
        Ownable(msg.sender) // gán owner là msg.sender
    {
        _mint(msg.sender, 300_000 * 10 ** 18); // gán số lượng token cho msg.sender là 300_000 * 10 ** 18 ví dụ 300.000 token với 1 token = 10 ** 18 wei = 1 ETH
    }

    function mint(address to, uint256 amount) external onlyOwner { // hàm mint là hàm tạo token
        _mint(to, amount); // gán số lượng token cho to là amount
    }

    function pause() external onlyOwner { // hàm pause là hàm pause token
        _pause(); // pause token
    }

    function unpause() external onlyOwner { // hàm unpause là hàm unpause token
        _unpause(); // unpause token
    }

    function _update( 
        address from, // from là address của người gửi token
        address to, // to là address của người nhận token
        uint256 value // value là số lượng token
    )
        internal // hàm _update là hàm update token
        override(ERC20, ERC20Capped) // kế thừa từ ERC20 và ERC20Capped
        whenNotPaused // khi không pause
    {
        super._update(from, to, value); // update token
    }
}

