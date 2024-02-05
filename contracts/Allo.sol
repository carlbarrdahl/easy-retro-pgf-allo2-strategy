// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {BaseStrategy} from "allo-v2/contracts/strategies/BaseStrategy.sol";
import {Allo} from "allo-v2/contracts/core/Allo.sol";
import {IAllo} from "allo-v2/contracts/core/interfaces/IAllo.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LocalAllo is Allo {}

contract LocalRegistry {
    function isOwnerOrMemberOfProfile(
        bytes32 _profileId,
        address _account
    ) external view returns (bool) {
        return true;
    }
}

contract LocalToken is ERC20 {
    constructor() ERC20("Token", "TOK") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
