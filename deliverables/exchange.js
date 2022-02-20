// k = 100,019,880,988,011,000,000
// 'k_balance[msg.sender]' = 998,001,000,000;
// k_balance[address(this)] = 100,000,000,000,000,000,000
// 'k_den' = 100,000,000,998,001,000,000;
// eth_reserves = 10,011,000,000
// token reserves = 9,990,998,001
// proportion of eth entitled = 998,001,000,000 * 10^18 / 100,000,000,998,001,000,000 = 9.98 * 10^9
// num_eth_entitled = 9.98 * 10^9 * 10,011,000,000 / 10^18 
// 100,000 <= num_eth_entitled ?

//init (createPool) adds 10,000,000,000 (10^10) wei
//this gives us a k of 10^20
//user then adds 1,000,000 wei
//k_user = 10^12 

//user then asks to remove 100,000 wei, which of course they are entitled to.

//k_den = 10^20 + 10^12
//k_user = 998,001,000,000 ~ 10^12
//portion_entitled = 10^12 / (10^20 + 10^12)
//eth entitled = portion_entitled * eth_reserves = (10^12 / (10^20 + 10^12)) * 10,011,000,000 = 100.....this is WRONG it SHOULD be 10^6, we are off by 10^4


//1000 * 1000 = 1,000,000 
//500 * 500 =  250,000 
//k_den = 1,000,000 + 250,000 = 1,250,000
//in reality, A is entitled to 1000 eth (2/3 of them)
//even though they are entitled to 50% of the eth. 

// =================== CS251 DEX Project =================== // 
//        @authors: Simon Tao '22, Mathew Hogan '22          //
// ========================================================= //                  

// sets up web3.js
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

const exchange_name = 'Your Exchange Name'; // TODO: fill in the name of your exchange

const token_name = 'FinnCoin';             // TODO: replace with name of your token
const token_symbol = 'FINN';               // TODO: replace with symbol for your token
const multiplier = Math.pow(10, 18);

// =============================================================================
//         ABIs and Contract Addresses: Paste Your ABIs/Addresses Here
// =============================================================================
// TODO: Paste your token contract address and ABI here:
const token_address = '0x2d2aa05140da0e4A90EC68143095aC34f66B729a';                   
const token_abi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "data",
				"type": "uint256"
			}
		],
		"name": "Mint",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "_disable_mint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "_mint",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "_totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "delegate",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "numTokens",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "numTokens",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "numTokens",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
const token_contract = new web3.eth.Contract(token_abi, token_address);

// TODO: Paste your exchange address and ABI here
const exchange_address = '0x4a398dd2A1b93977D0832ea4A04c8DEdAb10A203';    
const exchange_abi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "AddLiquidity",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "eth_reserves",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "token_reserves",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "k",
				"type": "uint256"
			}
		],
		"name": "CreatePool",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "string",
				"name": "message",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Debug",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountETH",
				"type": "uint256"
			}
		],
		"name": "Received",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "RemoveLiquidity",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "minPriceEth",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxPriceEth",
				"type": "uint256"
			}
		],
		"name": "addLiquidity",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amountTokens",
				"type": "uint256"
			}
		],
		"name": "createPool",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "eth_contributed",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "eth_reserves",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "initial_liquidity",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "k",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "k_balance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "priceETH",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "priceToken",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "removeAllLiquidity",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amountETH",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "minPriceEth",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxPriceEth",
				"type": "uint256"
			}
		],
		"name": "removeLiquidity",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "maxTokenPriceTolerated",
				"type": "uint256"
			}
		],
		"name": "swapETHForTokens",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amountTokens",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "maxEthPriceTolerated",
				"type": "uint256"
			}
		],
		"name": "swapTokensForETH",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "token_reserves",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
];            
const exchange_contract = new web3.eth.Contract(exchange_abi, exchange_address);



// =============================================================================
//                              Provided Functions
// =============================================================================
// Reading and understanding these should help you implement the below functions

/*** INIT ***/
async function init() {
    var poolState = await getPoolState();

    if (poolState['token_liquidity'] === 0
            && poolState['eth_liquidity'] === 0) {
                
                // Call mint twice to make sure mint can be called mutliple times prior to disable_mint
        const total_supply = 10000000000; //10^10
		await token_contract.methods._mint(total_supply / 2).send({from:web3.eth.defaultAccount, gas : 999999});
        await token_contract.methods._mint(total_supply / 2).send({from:web3.eth.defaultAccount, gas : 999999});
        await token_contract.methods._disable_mint().send({from:web3.eth.defaultAccount, gas : 999999});
        await token_contract.methods.approve(exchange_address, total_supply).send({from:web3.eth.defaultAccount});
        // initialize pool with equal amounts of ETH and tokens, so exchange rate begins as 1:1
        await exchange_contract.methods.createPool(total_supply).send({from:web3.eth.defaultAccount, value : total_supply, gas : 999999});
        // All accounts start with 0 of your tokens. Thus, be sure to swap before adding liquidity.

    }
}

async function getPoolState() {
    // read pool balance for each type of liquidity

    let liquidity_tokens = await exchange_contract.methods.token_reserves().call({from:web3.eth.defaultAccount});
    let liquidity_eth = await exchange_contract.methods.eth_reserves().call({from:web3.eth.defaultAccount});
    return {
        token_liquidity: liquidity_tokens * 10**(-18),
        eth_liquidity: liquidity_eth * 10**(-18),
        token_eth_rate: liquidity_tokens / liquidity_eth,
        eth_token_rate: liquidity_eth / liquidity_tokens
    };
}

// This is a log function, provided if you want to display things to the page instead of the
// JavaScript console. It may be useful for debugging but usage is not required.
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
    $("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}

// ============================================================
//                    FUNCTIONS TO IMPLEMENT
// ============================================================

// Note: maxSlippagePct will be passed in as an int out of 100. 
// Be sure to divide by 100 for your calculations.

/*** ADD LIQUIDITY ***/
async function addLiquidity(amountEth, maxSlippagePct) {
    /** TODO: ADD YOUR CODE HERE **/
    // do we need to check that the sender has enough eth?
    eth_balance = await web3.eth.getBalance(web3.eth.defaultAccount);
    
    if (eth_balance >= amountEth) { 
        const state = await getPoolState();
        const price_eth = state.token_eth_rate;
        const num_tokens = Math.trunc(price_eth  * amountEth);
        const minPriceEth = Math.floor(price_eth * (1 - maxSlippagePct / 100));
        const maxPriceEth = Math.ceil(price_eth * (1 + maxSlippagePct / 100));
        await token_contract.methods.approve(exchange_address, num_tokens).send({from:web3.eth.defaultAccount, gas: 999999})
        await exchange_contract.methods.addLiquidity(minPriceEth, maxPriceEth).send({from:web3.eth.defaultAccount, value : amountEth, gas : 999999});
    } else{
        console.log("user does not have enough eth")
    }
}

/*** REMOVE LIQUIDITY ***/
async function removeLiquidity(amountEth, maxSlippagePct) {
    //any error checking needed here?
    // var poolState = await getPoolState();
    const state = await getPoolState();
    const token_eth_rate = state.token_eth_rate;
    const minPriceEth = token_eth_rate * (1 - maxSlippagePct / 100);
    const maxPriceEth = token_eth_rate * (1 + maxSlippagePct / 100);
    await exchange_contract.methods.removeLiquidity(parseInt(amountEth), parseInt(minPriceEth), parseInt(maxPriceEth)).send({from:web3.eth.defaultAccount, gas: 999999});
}

async function removeAllLiquidity(maxSlippagePct) {
    // var poolState = await getPoolState();
    await exchange_contract.methods.removeAllLiquidity().send({from:web3.eth.defaultAccount, gas: 999999});
}

/*** SWAP ***/
// exchange receives tokens and sends eth to the client 
// the client sends tokens to the exchange and in return receives eth
// include approve to allow the exchange to transfer tokens from the client to itself
async function swapTokensForETH(amountToken, maxSlippagePct) {
    // var poolState = await getPoolState();
    //get the current observed eth price: 
    const state = await getPoolState();
    const token_eth_rate = state.token_eth_rate;
    const maxEthPriceTolerated = Math.ceil(token_eth_rate * (1 + maxSlippagePct / 100));
    await token_contract.methods.approve(exchange_address, parseInt(amountToken)).send({from:web3.eth.defaultAccount, gas: 999999})
    await exchange_contract.methods.swapTokensForETH(parseInt(amountToken, maxEthPriceTolerated), parseInt(maxEthPriceTolerated)).send({from:web3.eth.defaultAccount, gas: 999999});
}

// exchange receives eth and sends tokens to the client 
// the client sends eth to the exchange and in return receives tokens
async function swapETHForTokens(amountETH, maxSlippagePct) {
    const state = await getPoolState();
    const eth_token_rate = state.eth_token_rate;
    const maxTokenPriceTolerated = Math.ceil(eth_token_rate * (1 + maxSlippagePct / 100));
    //1.1
    //.082 eth / token.... underflow 
    await exchange_contract.methods.swapETHForTokens(maxTokenPriceTolerated).send({from:web3.eth.defaultAccount, value:parseInt(amountETH), gas: 999999});
}

// =============================================================================
//                           	UI (DO NOT MOFIDY)
// =============================================================================


// This sets the default account on load and displays the total owed to that
// account.
web3.eth.getAccounts().then((response)=> {
    web3.eth.defaultAccount = response[0];
    // Initialize the exchange
    init().then(() => {

      	
        
        // fill in UI with current exchange rate:
        getPoolState().then((poolState) => {
            $("#eth-token-rate-display").html("1 ETH = " + poolState['token_eth_rate'] + " " + token_symbol);
            $("#token-eth-rate-display").html("1 " + token_symbol + " = " + poolState['eth_token_rate'] + " ETH");

            $("#token-reserves").html(poolState['token_liquidity'] + " " + token_symbol);
            $("#eth-reserves").html(poolState['eth_liquidity'] + " ETH");
        });

        sanityCheck();	
    });

    web3.eth.getBalance(web3.eth.defaultAccount).then((res) => {
        $("#account-eth-balance").html("Ethereum balance: " + parseInt(res, 10) * 10**(-18) + " ETH");
    });
    token_contract.methods.balanceOf(web3.eth.defaultAccount).call({from:web3.eth.defaultAccount}).then((res) => {
        $("#account-tok-balance").html(token_name + " balance: " + parseInt(res, 10) * 10 **(-18) + " " + token_symbol);
    });;
});

// This code updates the 'My Account' UI with the balances of the account
$("#myaccount").change(function() {
    web3.eth.defaultAccount = $(this).val();
    web3.eth.getBalance(web3.eth.defaultAccount).then((res) => {
        $("#account-eth-balance").html("Ethereum balance: " + parseInt(res, 10) * 10**(-18) + " ETH");
    });
    token_contract.methods.balanceOf(web3.eth.defaultAccount).call({from:web3.eth.defaultAccount}).then((res) => {
        $("#account-tok-balance").html(token_name + " balance: " + parseInt(res, 10) * 10 **(-18) + " " + token_symbol);
    });;
});

// Allows switching between accounts in 'My Account'
web3.eth.getAccounts().then((response)=>{
    var opts = response.map(function (a) { return '<option value="'+
            a.toLowerCase()+'">'+a.toLowerCase()+'</option>' });
    $(".account").html(opts);
});

// This runs the 'swapETHForTokens' function when you click the button
$("#swap-eth").click(function() {
    web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
  swapETHForTokens($("#amt-to-swap").val(), $("#max-slippage-swap").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'swapTokensForETH' function when you click the button
$("#swap-token").click(function() {
    web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
  swapTokensForETH($("#amt-to-swap").val(), $("#max-slippage-swap").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'addLiquidity' function when you click the button
$("#add-liquidity").click(function() {
    web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
  addLiquidity($("#amt-eth").val(), $("#max-slippage-liquid").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'removeLiquidity' function when you click the button
$("#remove-liquidity").click(function() {
    web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
  removeLiquidity($("#amt-eth").val(), $("#max-slippage-liquid").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'removeAllLiquidity' function when you click the button
$("#remove-all-liquidity").click(function() {
    web3.eth.defaultAccount = $("#myaccount").val(); //sets the default account
  removeAllLiquidity($("#max-slippage-liquid").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// Fills in relevant parts of UI with your token and exchange name info:
$("#swap-eth").html("Swap ETH for " + token_symbol);

$("#swap-token").html("Swap " + token_symbol + " for ETH");

$("#title").html(exchange_name);

$("#exchange-title-header").html(exchange_name);



// =============================================================================
//                                SANITY CHECK
// =============================================================================

// This section contains a sanity check test that you can use to ensure your code
// works. We will be testing your code this way, so make sure you at least pass
// the given test. You are encouraged to write more tests!

// Uncomment the call to sanityCheck() (last line) to have it run when index.html is launched.

function check(name, condition) {
	if (condition) {
		console.log(name + ": SUCCESS");
		return 3;
	} else {
		console.log(name + ": FAILED");
		return 0;
	}
}

async function sanityCheck() {
	var score = 0;
	var accounts = await web3.eth.getAccounts();
	web3.eth.defaultAccount = accounts[0];

	console.log("\nTEST", "Swapping 10000000 wei for Tokens");
	await swapETHForTokens(10000000, 10);

	var eth_reserves = await exchange_contract.methods.eth_reserves().call();
	var token_reserves = await exchange_contract.methods.token_reserves().call();
	// Accounting for LP fees, if they have already implemented Part 5
	score += check("eth_reserves updated correctly", eth_reserves > 10000000000 && eth_reserves <= 10010000000);
	score += check("token_reserves updated correctly", token_reserves < 10000000000 && token_reserves >= 9990000000);
	// Check tokens and ETH were actually transferred
	var num_tokens = parseInt(await token_contract.methods.balanceOf(web3.eth.defaultAccount).call());
	score += check("Tokens were successfully transferred", num_tokens > 0 && num_tokens <= 10000000);


	console.log("\nTEST", "Adding Liquidity");
	eth_reserves = await exchange_contract.methods.eth_reserves().call();
	await addLiquidity(1000000, 10);
	var eth_reserves_1 = await exchange_contract.methods.eth_reserves().call();
	var token_reserves_1 = await exchange_contract.methods.token_reserves().call();
	score += check("eth_reserves updated correctly", eth_reserves_1 > eth_reserves);
	score += check("token_reserves updated correctly", token_reserves_1 > token_reserves);
	// Check tokens were actually transferred
	var num_tokens_2 = parseInt(await token_contract.methods.balanceOf(web3.eth.defaultAccount).call());
    console.log("num_tokens2 = ", num_tokens_2, " num_tokens = ", num_tokens);
	score += check("Tokens were successfully transferred to the pool", num_tokens_2 < num_tokens);

	console.log("\nTEST", "Removing Liquidity");
	await removeLiquidity(100000, 10);
	var eth_reserves_2 = await exchange_contract.methods.eth_reserves().call();
	var token_reserves_2 = await exchange_contract.methods.token_reserves().call();
	score += check("eth_reserves updated correctly", eth_reserves_2 == eth_reserves_1 - 100000);
	score += check("token_reserves updated correctly", token_reserves_2 < token_reserves_1);
	// Check tokens were actually transferred
	var num_tokens_3 = await token_contract.methods.balanceOf(web3.eth.defaultAccount).call();
	score += check("Tokens were successfully transferred to user", num_tokens_3 > num_tokens_2);


	console.log("\nTEST", "Swap Tokens for ETH");
	await swapTokensForETH(100000, 10);
	var eth_reserves_final = await exchange_contract.methods.eth_reserves().call();
	var token_reserves_3 = await exchange_contract.methods.token_reserves().call();
	score += check("eth_reserves updated correctly", eth_reserves_final < eth_reserves_2);
	score += check("token_reserves updated correctly", token_reserves_3 > token_reserves_2);
	// Check tokens and ETH were actually transferred
	var final_tokens = 	await token_contract.methods.balanceOf(web3.eth.defaultAccount).call();
	score += check("Tokens were successfully traded", final_tokens < num_tokens_3);

	// TODO: Students write their own tests for Part 4 + 5, since it depends on their design
	console.log("Final Score: " + score +"/36");
}

// Uncomment this to run when directly opening index.html
