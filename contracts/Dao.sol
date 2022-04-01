//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract Dao is AccessControl, ReentrancyGuard {
    event Deposit(address indexed sender, uint256 amount);
    event Withdraw(address indexed recipient, uint256 amount);
    
    bytes32 public constant CHAIR = keccak256("CHAIR");
    bytes32 public constant ADMIN = keccak256("ADMIN");

    address public chairPerson;
    address public voteToken;
    uint256 public minimumQuorum;
    uint256 public debatingPeriodDuration = 3 days;

    struct UserInfo {
        uint256 amount;
        uint256 voteTime;
    }

    struct Proposal {
        address contractAddress;
        bytes signature;
        string description;
        uint256 startTime;
    }
    
    struct VoteInfo {
        uint256 support;
        uint256 against;
        Proposal proposal;
    }

    mapping(address => UserInfo) public users;
    mapping(uint256 => VoteInfo) public votes;

    uint256 public currentId;

    constructor(
        address _chairPerson, address _voteToken, 
        uint256 _minimumQuorum, uint256 _debatingPeriodDuration) {

        voteToken = _voteToken;
        chairPerson = _chairPerson;
        minimumQuorum = _minimumQuorum;
        debatingPeriodDuration = _debatingPeriodDuration;

        _setupRole(CHAIR, chairPerson);
        _setupRole(ADMIN, msg.sender);
    }

    function deposit(uint256 _amount) public {
        require(_amount > 0, "Amount should be positive");

        IERC20(voteToken).transferFrom(msg.sender, address(this), _amount);

        users[msg.sender].amount += _amount;
        
        emit Deposit(msg.sender, _amount);
    }

    function withdraw() external nonReentrant {
        require(users[msg.sender].amount > 0, "User not found");
        require(
            block.timestamp - users[msg.sender].voteTime > debatingPeriodDuration, 
            "Debating period is not finished"
        );
        uint256 amount = users[msg.sender].amount;
        users[msg.sender].amount = 0;

        IERC20(voteToken).transfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount);
    }

    function addProposal(
        bytes calldata _callData, 
        address _recipient, 
        string memory _description) public onlyRole(CHAIR) {
        
        Proposal memory proposal = Proposal(_recipient, _callData, _description, block.timestamp);
        votes[currentId].proposal = proposal;

        currentId++;
    }

    function vote(uint256 _id, bool _supportAgainst) public {
        require(_id < currentId, "Not legit id");

        if (_supportAgainst) {
            votes[_id].support += users[msg.sender].amount;
        } else {
            votes[_id].against += users[msg.sender].amount;
        }

        if (votes[_id].proposal.startTime > users[msg.sender].voteTime) {
            users[msg.sender].voteTime = votes[_id].proposal.startTime;
        }
        
    }

    function finishProposal(uint256 _id) public returns (bool) {
        require(_id < currentId, "Not legit id");

        require(
            block.timestamp - votes[_id].proposal.startTime > debatingPeriodDuration, 
            "Debating period is not over"
        );
        require(votes[_id].support + votes[_id].against > minimumQuorum, "Less that minimum quorum");

        if (votes[_id].support > votes[_id].against) {
            address testContract = votes[_id].proposal.contractAddress;
            (bool success, ) = testContract.call(votes[_id].proposal.signature);
            require(success, "ERROR call func");
            return true;
        }

        return false;
    }

    // setters
    function setChairPerson(address _chairPerson) public onlyRole(ADMIN) {
        chairPerson = _chairPerson;
    }

    function setVoteToken(address _voteToken) public onlyRole(ADMIN) {
        voteToken = _voteToken;
    }

    function setMinimumQuorum(uint256 _minimumQuorum) public onlyRole(ADMIN) {
        minimumQuorum = _minimumQuorum;
    }

    function setDebatingPeriodDuration(uint256 _debatingPeriodDuration) public onlyRole(ADMIN) {
        debatingPeriodDuration = _debatingPeriodDuration;
    }
}