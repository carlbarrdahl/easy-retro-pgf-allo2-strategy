// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract LocalHedgey {
    event PlanCreated(
        uint256 indexed id,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 start,
        uint256 cliff,
        uint256 end,
        uint256 rate,
        uint256 period,
        address vestingAdmin,
        bool adminTransferOBO
    );

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
    ) external returns (uint256 newPlanId) {
        uint256 end = start + period;
        uint256 planId = 1;
        emit PlanCreated(
            planId,
            recipient,
            token,
            amount,
            start,
            cliff,
            end,
            rate,
            period,
            vestingAdmin,
            adminTransferOBO
        );
        return planId;
    }
}
