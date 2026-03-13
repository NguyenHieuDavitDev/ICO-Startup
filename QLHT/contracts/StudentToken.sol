
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StudentToken is
    ERC20,
    ERC20Capped,
    ERC20Burnable,
    Pausable,
    Ownable
{
    constructor()
        ERC20("Student Startup Token", "SST")
        ERC20Capped(1_000_000 * 10 ** 18)
        Ownable(msg.sender)
    {
        _mint(msg.sender, 300_000 * 10 ** 18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(
        address from,
        address to,
        uint256 value
    )
        internal
        override(ERC20, ERC20Capped)
        whenNotPaused
    {
        super._update(from, to, value);
    }
}

