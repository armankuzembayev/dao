//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract TestContract is AccessControl {

    bytes32 public constant DAO = keccak256("DAO");

    uint256 public counter;
    address public daoContract;

    constructor(address _daoContract) {
        daoContract = _daoContract;

        _setupRole(DAO, daoContract);
    }

    function incrementCounter() public onlyRole(DAO) {
        counter++;
    }
}