// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {BaseStrategy} from "allo-v2/contracts/strategies/BaseStrategy.sol";
import {IAllo, Metadata} from "allo-v2/contracts/core/interfaces/IAllo.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EasyRPGFStrategy is BaseStrategy, ReentrancyGuard {
    error INPUT_LENGTH_MISMATCH();

    constructor(
        address _allo,
        string memory _name
    ) BaseStrategy(_allo, _name) {}

    function initialize(
        uint256 _poolId,
        bytes memory _data
    ) external virtual override {
        __BaseStrategy_init(_poolId);
        emit Initialized(_poolId, _data);
    }

    function withdraw(
        address _recipient
    ) external nonReentrant onlyPoolManager(msg.sender) {
        IAllo.Pool memory pool = allo.getPool(poolId);
        _transferAmount(pool.token, _recipient, poolAmount);
        poolAmount = 0;
    }

    function _distribute(
        address[] memory _recipientIds,
        bytes memory _recipientAmounts,
        address _sender
    ) internal virtual override onlyPoolManager(_sender) {
        // Decode amounts from memory param
        uint256[] memory amounts = abi.decode(_recipientAmounts, (uint256[]));

        uint256 payoutLength = _recipientIds.length;

        // Assert at least one recipient
        if (payoutLength == 0) {
            revert INPUT_LENGTH_MISMATCH();
        }
        // Assert recipient and amounts length are equal
        if (payoutLength != amounts.length) {
            revert INPUT_LENGTH_MISMATCH();
        }

        IAllo.Pool memory pool = allo.getPool(poolId);
        for (uint256 i; i < payoutLength; ) {
            uint256 amount = amounts[i];
            address recipientAddress = _recipientIds[i];

            _transferAmount(pool.token, recipientAddress, amount);
            poolAmount -= amount;
            emit Distributed(
                recipientAddress,
                recipientAddress,
                amount,
                _sender
            );
            unchecked {
                ++i;
            }
        }
    }

    // Not used in this Strategy
    function _allocate(
        bytes memory _data,
        address _sender
    ) internal virtual override {}

    function _getRecipientStatus(
        address _recipientId
    ) internal view virtual override returns (Status) {}

    function _isValidAllocator(
        address _allocator
    ) internal view virtual override returns (bool) {}

    function _registerRecipient(
        bytes memory _data,
        address _sender
    ) internal virtual override returns (address) {}

    function _getPayout(
        address _recipientId,
        bytes memory _data
    ) internal view virtual override returns (PayoutSummary memory) {}
}
