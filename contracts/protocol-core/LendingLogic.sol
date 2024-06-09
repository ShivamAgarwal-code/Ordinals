// SPDX-License-Identifier: OrdinalDAO
pragma solidity ^0.8.0;
import {LoanOperations} from "./LoanOperations.sol";
contract Lending{
// calculating the value of loan on the basis of collateral 
 uint  LTV = 20;


 LoanOperations loanOp = new LoanOperations();
 
 function modifyLTV(uint _newVal) public {
     LTV = _newVal;
 }
 // 0.00002(RBTC)*10^8=2000RSAT
function calculateLoanAmt(uint _collateralVal) public pure returns(uint) {
 uint num = _collateralVal*20;
 uint denom = 100;
 return num/denom; // It is returning the value in RSAT (in lowest denomination)
} 
 function requestForLoan(uint _collateralVal) public   {
    uint loanAmt = calculateLoanAmt(_collateralVal);
    
 }
  function calMaxEligibleAmt(uint _collateralVal) public pure returns(uint){ // gives the user the max amount can be borrowed
    uint loanAmt = calculateLoanAmt(_collateralVal);
    return loanAmt;
 }

   function calculateTotalPayable(uint loanId) public view returns (uint) {
        uint amt = loanOp.getLoanInfo(loanId).borrowedAmount;
        uint block_difference = block.number - loanOp.getLoanInfo(loanId).timeOfBorrow;
        uint no_of_days = block_difference / 144;
        uint rate_of_interest = 2739; // 2739 x 10^(-5) , we manage the decimals below
        uint total_interest_non_decimal = amt * no_of_days * rate_of_interest;
        uint total_interest = total_interest_non_decimal / 100000;
        uint total_payable_amount = amt + total_interest;
        return total_payable_amount;
    }
   function calculateInterest(uint loanId) public view returns (uint) {
        uint amt = loanOp.getLoanInfo(loanId).borrowedAmount;
        uint block_difference = block.number - loanOp.getLoanInfo(loanId).timeOfBorrow;
        uint no_of_days = block_difference / 144;
        uint rate_of_interest = 2739; // 2739 x 10^(-5) , we manage the decimals below
        uint total_interest_non_decimal = amt * no_of_days * rate_of_interest;
        uint total_interest = total_interest_non_decimal / 100000;
        return total_interest;
    }
      function calApproxInterest(uint _amt,uint _days) public pure returns (uint) {
        uint amt = _amt;
        uint no_of_days = _days;
        uint rate_of_interest = 2739; // 2739 x 10^(-5) , we manage the decimals below
        uint total_interest_non_decimal = amt * no_of_days * rate_of_interest;
        uint total_interest = total_interest_non_decimal / 100000;
        return total_interest;
    }
    function fetchTimeSpent(uint loanId) public view returns (uint)
   {    uint time;
      if(loanOp.getLoanInfo(loanId).timeOfBorrow!=0)
      {
      time =  block.number-loanOp.getLoanInfo(loanId).timeOfBorrow; 
   }
   else{
      time = 0;
   }
       
     return (time);
   }

}