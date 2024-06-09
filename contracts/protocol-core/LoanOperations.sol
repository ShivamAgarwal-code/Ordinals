// SPDX-License-Identifier: OrdinalDAO
pragma solidity ^0.8.10;
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract LoanOperations 
{
using CountersUpgradeable for CountersUpgradeable.Counter;
 CountersUpgradeable.Counter public _loanIdTracker;
 mapping(uint=>DataTypes.Ordinal[]) public ordinalStaked;
 mapping(uint=>DataTypes.LoanData) public loans;

 event LoanCreated (
    address borrower,
    uint amt
 );
 event CollateralAdded
 (
    uint id,
    uint value
 );
  event CollateralInBatchAdded
 (
    uint id_beg,
    uint id_end,
    uint num_of_ord_staked,
    uint totalValue
 );
 address private poolContractAddress =0x8798886B80638F4aA3BAd4f528497A335BdD9247; 
 function createLoan(address _borrower,uint _amt) public returns(uint) 
 {
     _loanIdTracker.increment();
    uint idOfLoan = _loanIdTracker.current();
    loans[idOfLoan]=DataTypes.LoanData(idOfLoan,_borrower,_amt,block.number,DataTypes.LoanState.CREATED);
    emit LoanCreated(_borrower,_amt);
    return idOfLoan;

 }
 function addcollateral (uint _id, string memory _collName,uint _price,address _staker) public returns(uint)
 {
    address _owner=poolContractAddress; // pool contract address
    uint idOfLoan = _loanIdTracker.current();
    ordinalStaked[idOfLoan].push(DataTypes.Ordinal(_id,_collName,_price,_staker,_owner,DataTypes.OrdinalState.STAKED));
    emit CollateralAdded(_id,_price);
    return idOfLoan;
 }
 function addcollateralInBatch(uint[] memory _id, string[] memory _collName , uint[] memory _price , address _staker) public returns(uint[] memory ,uint)
 {
    address _owner = poolContractAddress;
    uint idOfLoan = _loanIdTracker.current();
    uint totalValue=0; uint num=_id.length;
    for(uint i=0;i<_price.length;i++)
    {
       totalValue = _price[i]+totalValue;
    }
    for(uint i=0;i<4;i++)
    {
       ordinalStaked[idOfLoan].push(DataTypes.Ordinal(_id[i],_collName[i],_price[i],_staker,_owner,DataTypes.OrdinalState.STAKED));
    }

    emit CollateralInBatchAdded(_id[0],_id[num-1],num,totalValue);
    return (_id,totalValue); // this id is not loan Id , it is escrow Id
    
 }
 function repayLoan(uint _loanId , address _owner) public
 {
   DataTypes.LoanData storage currentLoan = loans[_loanId];
   if(keccak256(abi.encodePacked(DataTypes.LoanState.CREATED)) == keccak256(abi.encodePacked(currentLoan.state)))
   {
      
      currentLoan.state = DataTypes.LoanState.REPAID;
   } 
   uint num_of_ord_staked=ordinalStaked[_loanId].length;
   DataTypes.Ordinal [] storage currentCollateral = ordinalStaked[_loanId];
   for(uint i=0;i<num_of_ord_staked;i++)
   {
     currentCollateral[i].state = DataTypes.OrdinalState.REPAID;
     currentCollateral[i].owner = _owner;

   }
 }

 function getLoanInfo (uint loanId) external view returns(DataTypes.LoanData memory)
 {
   return loans[loanId];
 }
}