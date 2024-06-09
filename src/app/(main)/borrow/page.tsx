'use client'

import { Fragment, useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { useMutation } from "@apollo/client";
import { operations } from "../../../utils/api/graphql"
import { signTransaction, SignTransactionOptions, BitcoinNetworkType } from 'sats-connect';

import { useAuthContext } from '@/lib/auth';

import { Dialog, Menu, Transition } from "@headlessui/react"
import { RadioGroup } from "@headlessui/react"
import TreasuryAddress from "../../../utils/contracts/TreasuryAddress"
import TreasuryJSON from "../../../utils/contracts/Treasury.json"


import {
	SearchNormal1,
	CloseCircle,
	Lock,
} from "iconsax-react";

import { InfoIcon } from "@/components/Icons";

import { classNames } from "@/utils"
import Escrow from './escrowTypes';
import Item from './itemTypes';

function Item({ item, clicked }: { item: any, clicked: any }) {
	return (
		<div className="p-3 border rounded-lg border-neutral-200 hover:bg-neutral-50 cursor-pointer" onClick={() => clicked(item.id)}>
			<div className="relative">
				<input type="checkbox" className="h-4 w-4 absolute left-4 top-4 accent-primary-600 rounded" checked={item.selected} onChange={e => { }} />
				<img src={item.image} className="rounded-lg"></img>
			</div>
			<div className="flex justify-between pt-4 pb-2 items-center">
				<div className="text-neutral-900 text-base font-bold">{item.name}</div>
				<div className="text-sm text-neutral-600">{item.status}</div>
			</div>
			<div className="text-sm text-neutral-600">Price {item.price} rBTC</div>
		</div>
	)
}

function BorrowModal({ isOpen, closeModal, items, escrows }: { isOpen: boolean, closeModal: any, items: Item[], escrows: Escrow[] }) {
	const [escrowId, setEscrowId] = useState()
	const [successStaking, setsuccessStaking] = useState("")
	const [eligibleAmt, setEligibleAmt] = useState("")
	const [approxAmt, setApproxInt] = useState("")
	const [days, setDays] = useState(7)


	//xverse credentials
	const [add1, setAdd1] = useState()
	const [add2, setAdd2] = useState()
	const [pubKey1, setPubKey1] = useState()
	const [pubKey2, setPubKey2] = useState()


	const { metamaskData, xverseData, setAuthMetamask, setAuthXverse, getProfile }: any = useAuthContext();

	//  console.log(metamaskData)
	//   console.log(xverseData)
	// setAdd1(xverseData.add1)
	// setAdd2(xverseData.add2)
	// setPubKey1(xverseData.pubKey1)
	// setPubKey2(xverseData.pubKey2)

	const selectedItems = items.filter((item: any) => item.selected);

	const times = [
		{ id: 1, time: "7 Days", value: "7" },
		{ id: 2, time: "14 Days", value: "14" },
		{ id: 3, time: "30 Days", value: "30" },
		{ id: 4, time: "60 Days", value: "60" },
		{ id: 5, time: "144 Days", value: "144" },
	]
	const [selectedTime, setSelectedTime] = useState(times[0])

	const steps = ["lock", "approve", "summary", "approve_wallet", "success"];

	const [step, setStep] = useState("lock");

	const borrowAmountRef = useRef<HTMLInputElement>(null);
	const [borrowAmount, setBorrowAmount] = useState(0.00); 
	const [broadcastEscrow] = useMutation(
		operations.mutations.BROADCAST_ESCROW,
		{
			onCompleted: (data) => {
				console.log("success :>> ", data);
				setsuccessStaking("Successful")
			},
			onError: (error) => {
				console.log("error :>> ", error);
				setsuccessStaking("Failed")
			},
		}
	);
	const [executeEscrow] = useMutation(
		operations.mutations.EXECUTE_ESCROW,
		{
			onCompleted: async (data) => {
				console.log(data.executeEscrow.transactions[0])
				let input = data.executeEscrow.transactions[0].inputs
				console.log(input)


				const inputsToSignBuild = Array.from({ length: input - 1 }, (_, i) => {
					return ({
						address: xverseData.add1,
						signingIndexes: [i + 1]
					})
				})
				inputsToSignBuild.push({
					address: xverseData.add2,
					signingIndexes: [0]
				})
				console.log(inputsToSignBuild)

				const signPsbtOptions: SignTransactionOptions = {
					payload: {
						network: {
							type: BitcoinNetworkType.Testnet
						},
						message: 'Sign Transaction',
						psbtBase64: data.executeEscrow.transactions[0].base64,
						broadcast: false,
						inputsToSign: inputsToSignBuild
					},
					onFinish: (response: any) => {
						console.log(escrowId)
						console.log(response)
						broadcastEscrow({
							variables: {
								data: {
									id: escrowId,
									transactions: [
										{
											base64: response.psbtBase64
										}
									]
								}
							}
						})

						console.log(escrowId)

					},
					onCancel: () => alert('Canceled'),
				}

				await signTransaction(signPsbtOptions);




			},
			onError: (error) => {
				console.log("error :>> ", error);
			},
		}
	);

	const [createEscrow, { loading, error }] = useMutation(
		operations.mutations.CREATE_ESCROW,
		{
			onCompleted: (data) => {
				console.log("success :>> ", data);
				setEscrowId(data.createEscrow.id)
				console.log(data.createEscrow.id)
				executeEscrow({
					variables: {
						where: { id: data.createEscrow.id }
					}
				})
			},
			onError: (error) => {
				console.log("error :>> ", error);
			},
		}
	);

	async function lockOridnalClicked() {
		// console.log(metamaskData);

		//fakefund()
		console.log(process.env.API_BASE_URL)
		setsuccessStaking("In progress");

		const filteredEscrows = (escrows as Escrow[]).filter((escrow) => {
			return items.some((item) => {
				return item.selected && item.id === escrow.collateral.assets[1].content.node.id;
			});
		});
		console.log(filteredEscrows)
		filteredEscrows.forEach((escrow) => {
			// createEscrow({
			// 	variables: {
			// 		data: escrow,
			// 	}
			// })  commented by sourav



			// .then((response) => {
			// 	console.log("Escrow created successfully:", response);
			// 	// Handle success if needed
			// })
			// .catch((error) => {
			// 	console.error("Error creating escrow:", error);
			// 	// Handle error if needed
			// });
		});

		setStep("approve");
	}
	let ordVal = 0.000079
	//console.log(metamaskData.signer)
	const TreasuryContract = new ethers.Contract(TreasuryAddress, TreasuryJSON.abi, metamaskData.signer);
	const fakefund = () => {
		let tx = TreasuryContract.fakeFund({ value: ethers.parseUnits("0.02", 18) })
		console.log(tx)
	}

	const getEligibleAmt = async () => // modal-3 eligible to borrow
	{
		try {
			let amount = await TreasuryContract.callMaxEligibleAmt(ordVal * 10 ** 18);
			console.log(amount + "is the amount");
			setEligibleAmt(ethers.formatUnits(amount.toString(), 18))
			console.log(eligibleAmt + "is the eligible amount");
		} catch (error) {
			console.log("Error in fetching eligible amt");
			console.log(error)
		}
	}


	function proceedToLoanClicked() {
		getEligibleAmt()
		console.log(eligibleAmt)


		setStep("summary");
	}
	let borrowAmt = 0.000015
	const getApproxInterest = async () => // modal-3 interest rate / approx interest
	{

		try {
			let amount = await TreasuryContract.callApproxInterest(borrowAmt * 10 ** 18, days);
			setApproxInt(ethers.formatUnits(amount.toString(), 18))
		} catch (error) {
			console.log("Error in fetching approx interest" + error);
		}
	}
	const checkInterest = () => {
		let id = selectedTime.id
		if (id == 1) {
			setDays(7)
			getApproxInterest()
			console.log(approxAmt)


		}
		else if (id == 2) {
			setDays(14)
			getApproxInterest()

		}
		else if (id == 3) {
			setDays(30)
			getApproxInterest()
			console.log(approxAmt)


		}
		else if (id == 4) {
			setDays(60)
			getApproxInterest()

		}
		else {
			setDays(144)
			getApproxInterest()

		}

	}
	async function submitClicked(e: any) {
		e.preventDefault();
		console.log("Submit clicked");
		if (borrowAmountRef?.current) {
			console.log(borrowAmountRef?.current["value"]);
			setBorrowAmount(parseFloat(borrowAmountRef?.current["value"]));
		}
		console.log(selectedTime);
		checkInterest()
		setStep("approve_wallet");
	}
	const processLoan = async () => { // modal-4 approve tx

		// try {
		// 	// await TreasuryContract.withdraw(ordVal * 10 ** 18, escrowId, "demo"); commented by sourav 
		// 	// enter in database

		const debt_principal = borrowAmount; 
		const debt_interest = 0.08 * debt_principal; 

		const data = {
			"user_id": 3,
			"debt_principal": debt_principal,
			"debt_interest": debt_interest,
			"loan_duration": selectedTime
		};
		console.log(data);

		fetch('http://localhost:8000/api/loans/store', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data)
		})
			.then(res => res.json())
			.then(data => {
				console.log(data.data.id);
				// Extract the ID from the first response
				const id = data.data.id;

				// Make the second POST request using the extracted ID
				return fetch('http://localhost:8000/api/stakedOrdinals', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						user_id: 3,
						loan_id: id,
						escrow_id: 456,
						image_url: 'iuasdka',
					})
				});
			})
			.then(res => res.json())  // Handle the response of the second POST request
			.then(console.log);      // Log the result of the second POST request
	}
	function approveTransactionClicked() {
		processLoan()
		setStep("success");
	}

	function onCompleteDialogClose() {
		closeModal();
		setStep("lock");
	}

	function onMaxClicked() {
		if (borrowAmountRef.current) {
			borrowAmountRef.current.value = approxAmt
		}
	}

	const lockDialog = (
		<>
			<div className="h-[160px] flex justify-center items-center mt-[30px]">
				<img src="/assets/nft-example.png" width="112px" height="112px" className="rounded-full" />
			</div>
			<div className="px-8 flex-col flex items-center">
				<div className="text-lg font-semibold">Lock your ordinals</div>
				<div className="text-neutral-600 text-sm pt-4 pb-8 text-center">
					In order to proceed, your Ordinal will be locked and used for staking.
				</div>
				<div className="flex pb-8 space-x-4 w-full">
					<button className="basis-1/2 grow rounded-lg bg-white h-10 text-neutral-900 border border-neutral-200 text-sm font-semibold" onClick={closeModal}>Close</button>
					<button className="basis-1/2 grow rounded-lg bg-neutral-900 h-10 text-white text-sm font-semibold" onClick={lockOridnalClicked}>Lock Ordinal</button>
				</div>
			</div>
		</>
	)

	// const approveDialog = (
	// 	<>
	// 		<div className="p-8">
	// 			<div className="flex items-center justify-center text-warning-500 pt-8"><Lock size={64} /></div>
	// 			{successStaking=="In progress" ? <div className="text-lg font-semibold text-center pt-8">Processing</div> : <div className="text-lg font-semibold text-center pt-8">Staking Failed</div>}


	// 			{successStaking==="In progress" ? <div className="text-lg font-semibold text-center pt-8">Staking Successful</div> : <div className="text-lg font-semibold text-center pt-8">Staking Failed</div>}
	// 			{successStaking!="In progress" ? <div className="text-neutral-600 text-sm pt-4 pb-8 text-center">You can continue to Borrow</div> : <div className="text-neutral-600 text-sm pt-4 pb-8 text-center">
	// 				Try to Stake the Ordinal again
	// 			</div>}

	// 			<div className="flex space-x-4 w-full">
	// 				<button className="basis-1/2 grow rounded-lg bg-white h-10 text-neutral-900 border border-neutral-200 text-sm font-semibold" onClick={closeModal}>Close</button>
	// 				{successStaking!="In progress" ? <button className="basis-1/2 grow rounded-lg bg-neutral-900 h-10 text-white text-sm font-semibold" onClick={proceedToLoanClicked}>Proceed to Borrow Rbtc</button> : ""}

	// 			</div>
	// 		</div>
	// 	</>
	// )


	const approveDialog = (
		<>
			<div className="p-8">
				<div className="flex items-center justify-center text-warning-500 pt-8">
					<Lock size={64} />
				</div>
				{(() => {
					switch (successStaking) {
						case "In progress":
							return (
								<>
									<div className="text-lg font-semibold text-center pt-8">
										Staking in progress
									</div>
									<div className="text-neutral-600 text-sm pt-4 pb-8 text-center">
										Please click confirm in the wallet popup
									</div>
								</>
							);
						case "Successful":
							return (
								<>
									<div className="text-lg font-semibold text-center pt-8">
										Staking Successful
									</div>
									<div className="text-neutral-600 text-sm pt-4 pb-8 text-center">
										You can continue to Borrow
									</div>
								</>
							);
						default:
							return (
								<>
									<div className="text-lg font-semibold text-center pt-8">
										Staking Failed
									</div>
									<div className="text-neutral-600 text-sm pt-4 pb-8 text-center">
										Try to Stake the Ordinal again
									</div>
								</>
							);
					}
				})()}
				<div className="flex space-x-4 w-full">
					<button
						className="basis-1/2 grow rounded-lg bg-white h-10 text-neutral-900 border border-neutral-200 text-sm font-semibold"
						onClick={closeModal}
					>
						Close
					</button>
					{/* only for testing */}
					<button
						className="basis-1/2 grow rounded-lg bg-neutral-900 h-10 text-white text-sm font-semibold"
						onClick={proceedToLoanClicked}
					>
						Proceed to Borrow Rbtc
					</button>
					{successStaking !== "In progress" && (
						<button
							className="basis-1/2 grow rounded-lg bg-neutral-900 h-10 text-white text-sm font-semibold"
							onClick={proceedToLoanClicked}
						>
							Proceed to Borrow Rbtc
						</button>
					)}
				</div>
			</div>
		</>
	);


	const summaryDialog = (
		<>
			<div className="h-[160px] flex justify-center items-center">
				<img src="/assets/nft-example.png" width="112px" height="112px" className="rounded-full" />
			</div>
			<div className="p-8">
				<form method="post">
					<div className="space-y-6">
						<div className="flex justify-between text-sm font-medium">
							<div>Ordinal Inscription ID:</div>
							<div>9b5ad40e4bd......6f3i0</div>
						</div>
						<div className="flex justify-between text-sm font-medium">
							<div>Ordinal Value:</div>
							<div>{ordVal} BTC</div>
						</div>
						<div className="flex justify-between text-sm font-medium">
							<div>Eligible to borrow</div>
							<div>{eligibleAmt} rBTC</div>
						</div>
						<div className="flex justify-between text-sm font-medium">
							<div>Loan to Value (LTV)</div>
							<div>20%</div>
						</div>
						<div className="h-[1px] bg-neutral-200"></div>
						<div>
							<div className="text-sm font-medium">Borrow amount</div>
							<div className="relative mt-2 rounded-md shadow-sm">
								<input
									ref={borrowAmountRef}
									type="number"
									name="borrow_amount"
									id="borrow_amount"
									className="block w-full rounded-md border-0 py-1.5 px-4 text-neutral-900 ring-1 ring-inset ring-neutral-200 focus:ring-neutral-200 h-[50px]"
									placeholder="0.00"
									step="any"
									max={eligibleAmt}

								/>
								<div className="absolute inset-y-0 right-0 flex items-center pr-3">
									<button className="rounded-2xl bg-neutral-900 text-white text-xs px-3 h-8" onClick={onMaxClicked}>MAX</button>
								</div>
							</div>
						</div>
						<div>
							<div className="text-sm font-medium">Select Borrowing time</div>
							<div>
								<RadioGroup value={selectedTime} onChange={setSelectedTime} className="bg-gray-50 p-1 border-neutral-200 border rounded-lg mt-4">
									<div className="flex space-x-2 items-center">
										{times.map((time) => (
											<RadioGroup.Option
												key={time.id}
												value={time}
												className={({ active }) =>
													classNames(
														active ? 'bg-warning-500 text-white' : 'bg-neutral-200 text-neutral-600',
														"flex-1 px-1.5 py-1 border-neutral-200 border rounded-lg cursor-pointer h-7 font-medium"
													)
												}
											>
												{({ checked, active }) => (
													<RadioGroup.Label as="span" className="flex items-center justify-center text-xs text-center">
														{time.time}
													</RadioGroup.Label>
												)}
											</RadioGroup.Option>
										))}
									</div>
								</RadioGroup>
							</div>
						</div>
						<div className="h-[1px] bg-neutral-200"></div>
						<button type="submit" className="rounded-lg bg-black text-white font-semibold text-sm h-10 w-full" onClick={submitClicked}>Submit</button>
					</div>
				</form>
			</div>
		</>
	)

	const approveWalletDialog = (
		<>
			<div className="p-8">
				<div className="flex items-center justify-center text-warning-500 pt-8"><InfoIcon size={64} /></div>
				<div className="text-lg font-semibold text-center pt-8">Approve Wallet Transaction</div>
				<div className="space-y-6 py-8">
					<div className="flex justify-between text-sm font-medium">
						<div>Ordinal Inscription ID:</div>
						<div>9b5ad40e4bd......6f3i0</div>
					</div>
					<div className="flex justify-between text-sm font-medium">
						<div>Ordinal Value:</div>
						<div>0.000079 BTC</div>
					</div>
					<div className="flex justify-between text-sm font-medium">
						<div>Borrow Amount</div>
						<div>{borrowAmt} rBTC</div>
					</div>
					<div className="flex justify-between text-sm font-medium">
						<div>Loan to Value (LTV)</div>
						<div>20%</div>
					</div>
					<div className="h-[1px] bg-neutral-200"></div>
					<div className="flex justify-between text-sm font-medium">
						<div>Interest :</div>
						<div>{approxAmt} rBTC</div>
					</div>
					<div className="flex justify-between text-sm font-medium">
						<div>Loan to Value (LTV)</div>
						<div>20%</div>
					</div>
				</div>
				<div className="flex space-x-4 w-full">
					<button className="basis-1/2 grow rounded-lg bg-white h-10 text-neutral-900 border border-neutral-200 text-sm font-semibold" onClick={closeModal}>Close</button>
					<button className="basis-1/2 grow rounded-lg bg-neutral-900 h-10 text-white text-sm font-semibold" onClick={approveTransactionClicked}>Approve Transaction</button>
				</div>
			</div>
		</>
	)

	const successDialog = (
		<>
			<div className="p-8">
				<div className="flex items-center justify-center text-warning-500 pt-8">
					<img src="/assets/success.png" width="64" height="64" />
				</div>
				<div className="text-lg font-semibold text-center pt-8">Transaction Successful</div>
				<div className="text-neutral-600 text-sm pt-4 pb-8 text-center">
					Your <span className="font-medium text-neutral-900">Ordinal</span> is now locked and <span className="font-medium text-neutral-900">0.082rBTC</span> deposited into your wallet.
				</div>
				<div className="flex space-x-4 w-full">
					<button className="basis-1/2 grow rounded-lg bg-white h-10 text-neutral-900 border border-neutral-200 text-sm font-semibold" onClick={onCompleteDialogClose}>Close</button>
				</div>
			</div>
		</>
	)

	function renderDialog(param: string) {
		switch (param) {
			case 'lock':
				return lockDialog
			case 'summary':
				return summaryDialog
			case 'approve':
				return approveDialog
			case 'approve_wallet':
				return approveWalletDialog
			case 'success':
				return successDialog
			default:
				return <div></div>
		}
	}

	return (
		<>
			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as="div" className="relative z-100" onClose={closeModal}>
					<Transition.Child
						as={Fragment}
						enter="ease-out duration-300"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					>
						<div className="fixed inset-0 bg-black bg-opacity-25" />
					</Transition.Child>

					<div className="fixed inset-0 overflow-y-auto">
						<div className="flex min-h-full items-center justify-center p-4 text-center">
							<Transition.Child
								as={Fragment}
								enter="ease-out duration-300"
								enterFrom="opacity-0 scale-95"
								enterTo="opacity-100 scale-100"
								leave="ease-in duration-200"
								leaveFrom="opacity-100 scale-100"
								leaveTo="opacity-0 scale-95"
							>
								<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-xl transition-all">
									{renderDialog(step)}
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	)
}

export default function Borrow() {
	const { metamaskData, xverseData, setAuthMetamask, setAuthXverse, getProfile }: any = useAuthContext();
	const [items, setItems] = useState<Array<{ id: string; name: string; status: string; price: string; image: string; selected: boolean }>>([]);
	const [escrows, setEscrows] = useState<Escrow[]>([]); // Use the interface in state definition
	const [isLoading, setIsLoading] = useState(false);
	const fetchData = async () => {
		try {
			const response = await fetch('/api/cryptoAPI', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					address: xverseData.add2
				}),
				cache: 'no-store'
			});

			const data = await response.json();
			console.log(data)
			const escrowsData = (data.data.items as Array<{
				amount: string,
				transactionId: string,
				index: number
			}>).map(item => {
				return {
					startDate: "2023-07-15T22:40:56+01:00",
					endDate: "2023-08-14T21:40:37.658Z",
					collateral: {
						assets: [
							{
								type: "btc.address",
								content: {
									meta: { amount: parseInt("10000") },
									node: {
										publicKey: xverseData.pubKey1,
										value: xverseData.add1
									}
								},
								action: { type: "fee" },
								addresses: [
									{
										value: xverseData.add1,
										type: "change",
										publicKey: xverseData.pubKey1
									}
								]
							},
							{
								type: "btc.utxo",
								content: {
									meta: { amount: parseFloat(item.amount) * 100000000 }, // 
									node: {
										id: item.transactionId,
										sequence: item.index,
										publicKey: xverseData.pubKey2,
										value: xverseData.add2
									}
								},
								action: {
									configuration: {
										paths: [
											{
												"fn": "time",
												"tag": "unlock",
												"addresses": [{ "value": xverseData.add2, "type": "receive" }],
												"args": ["2023-08-25 17:49:18", "0387d7cc841bd941968e7ed394785b624490a88c579ed14c91c7ec42ef70bfb5d6"]
											}
										]
									},
									type: "lock",
								},
								addresses: [
									{
										value: xverseData.add2,
										type: "change",
										publicKey: xverseData.pubKey2
									},
								]
							},
						],
					},
				};
			});
			console.log(escrowsData)
			setItems(escrowsData.map((_, index) => ({
				id: escrowsData[index].collateral.assets[1].content.node.id || '',
				name: "Doodle Max2",
				status: "Available",
				price: "0.12",
				image: "/assets/nft-example.png",
				selected: false
			})));
			setEscrows(escrowsData);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	useEffect(() => {
		fetchData();
	}, [xverseData]);

	const [canStake, setCanStake] = useState(false);

	let selectedItems = [];

	const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

	function itemClicked(id: string) {
		const newItems = items.map((item) => {
			if (id == item.id) {
				item.selected = !item.selected
			}
			return item
		});
		setItems(newItems);
		// console.log(items)
		selectedItems = newItems.filter((item) => item.selected);
		setCanStake(selectedItems.length != 0);
	}

	function onStakeOrdinalButtonClicked() {
		setIsBorrowModalOpen(true)
	}

	function closeBorrowModal() {
		setIsLoading(true); // Set loading state to true
		fetchData();
		setIsBorrowModalOpen(false);
	}

	const [base64Signed, setbase64] = useState();
	const [escrowId, setEscrowId] = useState();
	const [showLockModal, setshowLockModal] = useState(true);

	// const [broadcastEscrow] = useMutation(
	// 	operations.mutations.BROADCAST_ESCROW,
	// 	{
	// 		onCompleted: (data: any) => {
	// 			console.log("success :>> ", data);
	// 		},
	// 		onError: (error: any) => {
	// 			console.log("error :>> ", error);
	// 		},
	// 	}
	// );

	// const [executeEscrow] = useMutation(
	// 	operations.mutations.EXECUTE_ESCROW,
	// 	{
	// 		onCompleted: async (data: any) => {
	// 			console.log(data.executeEscrow.transactions[0])

	// 			const signPsbtOptions: SignTransactionOptions = {
	// 				payload: {
	// 					network: {
	// 						type: BitcoinNetworkType.Testnet
	// 					},
	// 					message: 'Sign Transaction',
	// 					psbtBase64: data.executeEscrow.transactions[0].base64,
	// 					broadcast: false,
	// 					inputsToSign: [
	// 						{
	// 							address: "tb1pekd7wajtlpu7ncd0mvjvpge9penk8knfl7wcvtwjramv0ve3e39sx023kf",
	// 							signingIndexes: [0],
	// 						},
	// 						{
	// 							address: "2N5NdDEwyAiNBPWL2MNvfvcTxVobJtS5SVy",
	// 							signingIndexes: [1],
	// 						}
	// 					],
	// 				},
	// 				onFinish: (response: any) => {
	// 					setbase64(response.psbtBase64)
	// 					// console.log(escrowId)
	// 				},
	// 				onCancel: () => alert('Canceled'),
	// 			}

	// 			await signTransaction(signPsbtOptions);
	// 			console.log(base64Signed)
	// 			console.log(escrowId)
	// 			broadcastEscrow({
	// 				variables: {
	// 					data: {
	// 						id: escrowId,
	// 						transactions: [
	// 							{
	// 								base64: base64Signed
	// 							}
	// 						]
	// 					}
	// 				}
	// 			})


	// 		},
	// 		onError: (error: any) => {
	// 			console.log("error :>> ", error);
	// 		},
	// 	}
	// );
	// const [createEscrow, { loading, error }] = useMutation(
	// 	operations.mutations.CREATE_ESCROW,
	// 	{
	// 		onCompleted: (data: any) => {
	// 			console.log("success :>> ", data);
	// 			setEscrowId(data.createEscrow.id)
	// 			executeEscrow({
	// 				variables: {
	// 					where: { id: data.createEscrow.id }
	// 				}
	// 			})
	// 		},
	// 		onError: (error: any) => {
	// 			console.log("error :>> ", error);
	// 		},
	// 	}
	// );
	// const handleStaking = async (e: any) => {
	// 	e.preventDefault()
	// 	//this is escrow
	// 	const escrow = {
	// 		startDate: "2023-07-15T22:40:56+01:00",
	// 		endDate: "2023-08-14T21:40:37.658Z",

	// 		collateral: {
	// 			assets: [
	// 				{
	// 					type: "btc.address", // 
	// 					content: {
	// 						meta: { amount: "1000" },
	// 						node: {
	// 							publicKey: "0393cdaf0a037c1cbd571965c188015aa2d517cba01aaa9b445675f6ddee359e9d",
	// 							value: "2N5NdDEwyAiNBPWL2MNvfvcTxVobJtS5SVy"
	// 						}
	// 					},
	// 					action: { type: "fee" },
	// 					addresses: [
	// 						{
	// 							value: "2N5NdDEwyAiNBPWL2MNvfvcTxVobJtS5SVy",
	// 							type: "change",
	// 							publicKey: "0393cdaf0a037c1cbd571965c188015aa2d517cba01aaa9b445675f6ddee359e9d"
	// 						}
	// 					]
	// 				},
	// 				{
	// 					type: "btc.utxo",
	// 					content: {
	// 						meta: { amount: "7113" }, //amount
	// 						node: {
	// 							id: "d54741c1007597ff8843e70d2402ea61cb010b258478bbb1bde2ab5375f52a68", //transaction id
	// 							sequence: 0, //index
	// 							publicKey: "85a8de5c77fef2f6afd8596f6fe1560f556fa6aacd360e4d88492f01cf48886e",
	// 							value: "tb1pekd7wajtlpu7ncd0mvjvpge9penk8knfl7wcvtwjramv0ve3e39sx023kf"
	// 						}
	// 					},
	// 					action: {
	// 						configuration: {
	// 							paths: [

	// 								{
	// 									"fn": "time",
	// 									"tag": "unlock",
	// 									"addresses": [{ "value": "tb1pekd7wajtlpu7ncd0mvjvpge9penk8knfl7wcvtwjramv0ve3e39sx023kf", "type": "receive" }], "args": ["2023-08-25 17:49:18", "0387d7cc841bd941968e7ed394785b624490a88c579ed14c91c7ec42ef70bfb5d6"]
	// 								}
	// 							]
	// 						},
	// 						type: "lock",
	// 					},
	// 					addresses: [
	// 						{
	// 							value: "tb1pekd7wajtlpu7ncd0mvjvpge9penk8knfl7wcvtwjramv0ve3e39sx023kf",
	// 							type: "change",
	// 							publicKey: "85a8de5c77fef2f6afd8596f6fe1560f556fa6aacd360e4d88492f01cf48886e"
	// 						},
	// 					]
	// 				},
	// 			],
	// 		},
	// 	};
	// 	// api calls

	// 	createEscrow({
	// 		variables: {
	// 			data: escrow,
	// 		}
	// 	})
	// 	setshowLockModal(true)

	// }

	const handleSignOrdinal = async (e: any) => {
		e.preventDefault()
	}

	return (
		<>
			<main className="bg-neutral-100 text-neutral-900 p-10">
				<div className="flex flex-col space-y-10 text-black">
					<div>
						<div>
							<div className="text-neutral-900 text-xl font-medium pb-2">Borrow</div>
							<div className="text-neutral-600 text-base font-medium">Lock your ordinal, borrow rBTC</div>
						</div>
						<div className="flex justify-between pt-6 space-x-6 w-full">
							<div>
								<div className="relative rounded-md shadow-sm">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<span className="text-gray-500 sm:text-sm">
											<SearchNormal1 size={20} />
										</span>
									</div>
									<input
										type="text"
										name="search"
										className="block w-full rounded-lg border-0 py-1.5 pl-10 pr-20 text-neutral-900 ring-1 ring-inset placeholder:text-gray-500 text-sm h-11 ring-neutral-200 focus:ring-neutral-500 focus:ring-1"
										placeholder="Search ordinals"
									/>
								</div>
							</div>
							<div>
								<button className={classNames("h-11 text-white rounded-lg px-8 font-semibold text-sm w-[148px]", !canStake ? "bg-neutral-400" : "bg-warning-500")} disabled={!canStake} onClick={onStakeOrdinalButtonClicked}>Stake Ordinal</button>
							</div>
						</div>
						<div className="pt-6">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								{items.map((item, index) => <Item key={item.id} item={item} clicked={itemClicked} />)}
							</div>
						</div>
					</div>
				</div>
			</main>
			<BorrowModal isOpen={isBorrowModalOpen} closeModal={closeBorrowModal} items={items} escrows={escrows} />
		</>
	);
}

