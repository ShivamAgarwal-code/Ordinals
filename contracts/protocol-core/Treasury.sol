// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./LendingLogic.sol";
import {LoanOperations} from "./LoanOperations.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
contract Treasury is Lending{

    LoanOperations loanOperation= new LoanOperations();
     ERC20Burnable public Ltoken;
   constructor(address _Ltoken) 
   {
      Ltoken = ERC20Burnable(_Ltoken);
   }
       event receiveFundEvent(
     uint  indexed  amount 
   );
   event withdrawEvent(
       address  indexed borrower,
       uint indexed amount
   );
   function callMaxEligibleAmt(uint _collval) public pure returns(uint) // geting the max borrow amt
   {
     uint loanAmt = super.calMaxEligibleAmt(_collval);
     return loanAmt;
   }
   function callApproxInterest(uint _amtBorrowed , uint _days) public pure returns(uint) // getting the approx interest rate
   {
      uint interest = super.calApproxInterest(_amtBorrowed,_days);
      return interest;
   }
   function withdraw (uint256  _collateralVal,uint _collId,string memory _collName , uint _borrowAmt) public returns(uint)
   {  
    uint eligibleAmt = super.calculateLoanAmt( _collateralVal);
    require(_borrowAmt<=eligibleAmt,"Cannot Borrow this amount");
    uint loanId=loanOperation.createLoan(msg.sender,_borrowAmt);
    loanId=loanOperation.addcollateral(_collId,_collName,_collateralVal,msg.sender);
    super.requestForLoan(_collateralVal);
    payable(msg.sender).transfer(eligibleAmt);
    Ltoken.burnFrom(address(this),1); // amount need to be fixed
    emit withdrawEvent(msg.sender,eligibleAmt);
    return loanId;
   }
  //  function withdrawForBatch (uint256 [] memory _collateralVal,uint [] memory _collId,string [] memory _collName) public returns(uint [] memory)
  //  {
  //  // uint loanId=loanOperation.createLoan(msg.sender,eligibleAmt);
  //  uint [] memory ids; uint totalCollateralVal;
  //  (ids,totalCollateralVal)=loanOperation.addcollateralInBatch(_collId,_collName,_collateralVal,msg.sender);
  //  uint eligibleAmt = super.calculateLoanAmt(totalCollateralVal);
  //   super.requestForLoan(_collateralVal);
  //   payable(msg.sender).transfer(eligibleAmt);
  //   emit withdrawEvent(msg.sender,eligibleAmt);
  //   return (ids);
  //  }
    function rePay(uint _loanId) payable public 
   {
    uint amt = super.calculateTotalPayable();
    require(msg.value>=amt,"Repay_The_correct_amount");
    loanOperation.repayLoan(_loanId,msg.sender);
    super.resetValue();
    emit receiveFundEvent(msg.value);
   }
     function checkPaybleAmt() public view returns(uint) 
  {
    return super.calculateInterest();
  }
    function getContractBalance() public view returns(uint)
  {
    return address(this).balance;
  }
  function fakeFund() public payable{}
   
}