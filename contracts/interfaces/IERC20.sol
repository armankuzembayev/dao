//SPDX-License-Identifier: Unlicense
pragma solidity  ^0.8.0;


interface IERC20 {
    event Transfer(address indexed _from, address indexed _to, uint256 _amount);
    event Approval(address indexed _owner, address indexed _spender, uint256 _amount);

    function transfer(address _recipient, uint256 _amount) external returns (bool);

    function transferFrom(address _sender, address _recipient, uint256 _amount) external returns (bool);

    function approve(address _spender, uint256 _amount) external returns (bool);

    function increaseAllowance(address _spender, uint256 _amount) external returns (bool);

    function decreaseAllowance(address _spender, uint256 _amount) external returns (bool);

    function allowance(address _owner, address _spender) external view returns (uint256);
    
    function balanceOf(address _user) external view returns (uint256);
}