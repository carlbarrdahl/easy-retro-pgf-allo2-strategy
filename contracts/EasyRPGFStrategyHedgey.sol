// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BaseStrategy} from "allo-v2/contracts/strategies/BaseStrategy.sol";
import {IAllo} from "allo-v2/contracts/core/interfaces/IAllo.sol";

interface ITokenVestingPlans {
    function createPlan(
        address recipient,
        address token,
        uint256 amount,
        uint256 start,
        uint256 cliff,
        uint256 rate,
        uint256 period,
        address vestingAdmin,
        bool adminTransferOBO
    ) external returns (uint256 newPlanId);
}

contract EasyRPGFStrategyHedgey is BaseStrategy {
    error INPUT_LENGTH_MISMATCH();
    error NOOP();

    struct HedgeyParams {
        address adminAddress;
        address contractAddress;
        uint256 duration;
    }
    HedgeyParams public hedgey;

    constructor(
        address _allo,
        string memory _name
    ) BaseStrategy(_allo, _name) {}

    function initialize(
        uint256 _poolId,
        bytes memory _data
    ) external virtual override {
        __BaseStrategy_init(_poolId);

        hedgey = abi.decode(_data, (HedgeyParams));

        emit Initialized(_poolId, _data);
    }

    /// @notice Withdraw pool funds
    /// @param _token Token address
    /// @param _recipient Address to send the funds to
    function withdraw(
        address _token,
        address _recipient
    ) external onlyPoolManager(msg.sender) {
        uint256 _poolAmount = poolAmount;
        poolAmount = 0;
        _transferAmount(_token, _recipient, _poolAmount);
    }

    /// @notice Distribute pool funds
    /// @param _recipientIds Array of addresses to send the funds to
    /// @param _recipientAmounts Array of amounts that maps to _recipientIds array
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
        IERC20(pool.token).approve(hedgey.contractAddress, poolAmount);
        for (uint256 i; i < payoutLength; ) {
            uint256 amount = amounts[i];
            address recipientAddress = _recipientIds[i];

            poolAmount -= amount;

            uint256 rate = amount / hedgey.duration;

            ITokenVestingPlans(hedgey.contractAddress).createPlan(
                recipientAddress,
                pool.token,
                amount,
                block.timestamp,
                0, // No cliff
                rate,
                1,
                hedgey.adminAddress,
                true
            );
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

    receive() external payable {}

    // Not used in this Strategy
    function _allocate(bytes memory, address) internal virtual override {
        revert NOOP();
    }

    function _getRecipientStatus(
        address
    ) internal view virtual override returns (Status) {
        revert NOOP();
    }

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
