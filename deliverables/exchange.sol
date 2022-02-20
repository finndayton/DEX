// =================== CS251 DEX Project =================== // 
//        @authors: Simon Tao '22, Mathew Hogan '22          //
// ========================================================= //    
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '../interfaces/erc20_interface.sol';
import '../libraries/safe_math.sol';
import './token.sol';


contract TokenExchange {
    using SafeMath for uint;
    address public admin;

    address tokenAddr =  0x2d2aa05140da0e4A90EC68143095aC34f66B729a;                  // TODO: Paste token contract address here. No quotes. 
    FinnCoin private token = FinnCoin(tokenAddr);                                   // TODO: Replace "Token" with your token class.             

    // Liquidity pool for the exchange
    uint public token_reserves = 0;
    uint public eth_reserves = 0;
    uint public initial_liquidity = 0;
    
    uint private k_den = 0;
    uint private multiplier = 10**18;
    mapping(address => uint) public k_balance;
    mapping(address => uint) public eth_contributed;

    
    // Constant: x * y = k
    uint public k;
    
    // liquidity rewards
    uint private swap_fee_numerator = 0;       // TODO Part 5: Set liquidity providers' returns.
    uint private swap_fee_denominator = 100;
    
    event AddLiquidity(address from, uint amount);
    event RemoveLiquidity(address to, uint amount);
    event Received(address from, uint amountETH);
    event Debug(string message, uint value);
    event CreatePool(string message, uint eth_reserves, uint token_reserves, uint k);

    constructor() 
    {
        admin = msg.sender;
    }
    
    modifier AdminOnly {
        require(msg.sender == admin, "Only admin can use this function!");
        _;
    }

    // Used for receiving ETH
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    fallback() external payable{}

    // Function createPool: Initializes a liquidity pool between your Token and ETH.
    // ETH will be sent to pool in this transaction as msg.value
    // amountTokens specifies the amount of tokens to transfer from the liquidity provider.
    // Sets up the initial exchange rate for the pool by setting amount of token and amount of ETH.
    function createPool(uint amountTokens)
        external
        payable
        AdminOnly
    {
        // require pool does not yet exist
        require (token_reserves == 0, "Token reserves was not 0");
        require (eth_reserves == 0, "ETH reserves was not 0.");

        // require nonzero values were sent
        require (msg.value > 0, "Need ETH to create pool.");
        require (amountTokens > 0, "Need tokens to create pool.");

        token.transferFrom(msg.sender, address(this), amountTokens);
        eth_reserves = msg.value;
        token_reserves = amountTokens;
        k = eth_reserves.mul(token_reserves);
        

        emit CreatePool('log data from createPool', eth_reserves, token_reserves, k);
    
        // TODO: Keep track of the initial liquidity added so the initial provider
        //          can remove this liquidity
        eth_contributed[msg.sender] = msg.value;
    }

    // ============================================================
    //                    FUNCTIONS TO IMPLEMENT
    // ============================================================
    /* Be sure to use the SafeMath library for all operations! */
    
    // Function priceToken: Calculate the price of your token in ETH.
    // You can change the inputs, or the scope of your function, as needed.
    function priceToken() 
        public 
        view
        returns (uint)
    {
        return (eth_reserves.mul(multiplier)).div(token_reserves);
    }

    // Function priceETH: Calculate the price of ETH for your token.
    // You can change the inputs, or the scope of your function, as needed.
    function priceETH()
        public
        // view
        returns (uint)
    {
        emit Debug("eth_reserves = ", eth_reserves);
        emit Debug("token_reserves = ", token_reserves);
        emit Debug("multiplier = ", multiplier);
        require(eth_reserves > 0, "eth_reserves must be greater than 0 (priceETH)");
        return (token_reserves.mul(multiplier)).div(eth_reserves);
    }

    
    /* ========================= Liquidity Provider Functions =========================  */ 

    // Function addLiquidity: Adds liquidity given a supply of ETH (sent to the contract as msg.value)
    // You can change the inputs, or the scope of your function, as needed.
    function addLiquidity(uint minPriceEth, uint maxPriceEth) 
        external 
        payable
    {
        /******* TODO: Implement this function *******/
        /* HINTS:
            Calculate the liquidity to be added based on what was sent in and the prices.
            If the caller possesses insufficient tokens to equal the ETH sent, then transaction must fail.
            Update token_reserves, eth_reserves, and k.
            Emit AddLiquidity event.
        */
        
        //handle slippage
        require(priceETH() > minPriceEth.mul(multiplier), "the price of eth has fallen too low to add liquidity");
        require(priceETH() < maxPriceEth.mul(multiplier), "the price of eth has risen too high to add liquidity");

        require(msg.value > 0, "provided eth amount was 0");
        
        //how many tokens does this new eth correspond to?
        uint new_tokens = (msg.value.mul(priceETH()).div(multiplier));
        require(token.balanceOf(msg.sender) >= new_tokens, "sender does not posses enough FinnCoin");
        
        //transfer the tokens from the user to the exchange
        token.transferFrom(msg.sender, address(this), new_tokens);
        
        //the exchange has this many more tokens now
        token_reserves = token_reserves.add(new_tokens);
        
        //the exchange has this many more eth now
        eth_reserves = eth_reserves.add(msg.value);
        
        //the k of the entire protocol needs to be updated
        k = eth_reserves.mul(token_reserves);
        
        //K_den has this new liquidity added to it 
        // uint user_new_liquidity = msg.value.mul(new_tokens);
        // k_den = k_den.add(user_new_liquidity);
        
        //this user's personal liquidity stake is updated
        eth_contributed[msg.sender] = eth_contributed[msg.sender].add(msg.value);
        emit AddLiquidity(msg.sender, msg.value); 
        
    }
    

    // Function removeLiquidity: Removes liquidity given the desired amount of ETH to remove.
    // You can change the inputs, or the scope of your function, as needed.
    function removeLiquidity(uint amountETH, uint minPriceEth, uint maxPriceEth)
        public 
        payable
    {
        /******* TODO: Implement this function *******/
        /* HINTS:
            Calculate the amount of your tokens that should be also removed.
            Transfer the ETH and Token to the provider.
            Update token_reserves, eth_reserves, and k.
            Emit RemoveLiquidity event.
        */
        //verify that this msg.sender has the right to do this 
        emit Debug("amountETH = ", amountETH);
        
        //handle slippage
        require(priceETH() > minPriceEth.mul(multiplier), "the price of eth has fallen too low to remove liquidity");
        require(priceETH() < maxPriceEth.mul(multiplier), "the price of eth has risen too high to remove liquidity");
        
        require(amountETH > 0, "ETH amount must be greater than 0");
        require (amountETH < eth_reserves, "Cannot withdraw all eth from the pool");

        require(amountETH <= eth_contributed[msg.sender], "User is not entitled to withdraw this many eth");
        
        //if they were to withdraw this many eth, what is the corresponding number of tokens?
        uint corresponding_tokens = (priceETH().mul(amountETH)).div(multiplier);
        
        //Update total pool liquidity 
        eth_reserves = eth_reserves.sub(amountETH);
        token_reserves = token_reserves.sub(corresponding_tokens);
        k = eth_reserves.mul(token_reserves);
        
        
        eth_contributed[msg.sender] = eth_contributed[msg.sender].sub(msg.value);

        //Send sender their eth and tokens 
        token.transfer(msg.sender, corresponding_tokens); //send them back Finn Coin
        
        (bool success, ) = payable(msg.sender).call{value:amountETH}("");
        require(success, "Failed to send Ether");
        
        emit RemoveLiquidity(msg.sender, amountETH);
        
    }

    // Function removeAllLiquidity: Removes all liquidity that msg.sender is entitled to withdraw
    // You can change the inputs, or the scope of your function, as needed.
    function removeAllLiquidity()
        external
        payable
    {
        /******* TODO: Implement this function *******/
        /* HINTS:
            Decide on the maximum allowable ETH that msg.sender can remove.
            Call removeLiquidity().
        */
   
        require(eth_contributed[msg.sender] > 0, "This user has 0% stake in the protocol");
        removeLiquidity(eth_contributed[msg.sender], 0, priceETH() * multiplier);
    }
    

    /***  Define helper functions for liquidity management here as needed: ***/
    

    /* ========================= Swap Functions =========================  */ 

    // Function swapTokensForETH: Swaps your token with ETH
    // You can change the inputs, or the scope of your function, as needed.
    function swapTokensForETH(uint amountTokens, uint maxEthPriceTolerated)
        external 
        payable
    {
        /******* TODO: Implement this function *******/
        /* HINTS:
            Calculate amount of ETH should be swapped based on exchange rate.
            Transfer the ETH to the provider.
            If the caller possesses insufficient tokens, transaction must fail.
            If performing the swap would exhaus total ETH supply, transaction must fail.
            Update token_reserves and eth_reserves.

            Part 4: 
                Expand the function to take in addition parameters as needed.
                If current exchange_rate > slippage limit, abort the swap.
            
            Part 5:
                Only exchange amountTokens * (1 - liquidity_percent), 
                    where % is sent to liquidity providers.
                Keep track of the liquidity fees to be added.
        */
        
        require(priceETH() < maxEthPriceTolerated.mul(multiplier), "the price of eth has exceeded the allowed range");

        
        require(token.balanceOf(msg.sender) >= amountTokens, "sender does not posses enough FinnCoin");
        
        uint amount_eth = (amountTokens.mul(priceToken())).div(multiplier);
        // uint amount_eth = k.div(amountTokens.add(token_reserves));
        require(amount_eth < eth_reserves, "Performing the swap would exhaust total eth supply");
        
        
        //send the protocol Tokens. This will require an approve in JS
        token.transferFrom(msg.sender, address(this), amountTokens);
        
        //send the sender the corresponding Eth
        (bool success, ) = payable(msg.sender).call{value:amount_eth}("");
        require(success, "Failed to send Ether in swap");
        
        //bookkeeping 
        token_reserves = token_reserves.add(amountTokens);
        eth_reserves = eth_reserves.sub(amount_eth);
        k = token_reserves.mul(eth_reserves);
        

        /***************************/
        // DO NOT MODIFY BELOW THIS LINE
        /* Check for x * y == k, assuming x and y are rounded to the nearest integer. */
        // Check for Math.abs(token_reserves * eth_reserves - k) < (token_reserves + eth_reserves + 1));
        //   to account for the small decimal errors during uint division rounding.
        uint check = token_reserves.mul(eth_reserves);
        if (check >= k) {
            check = check.sub(k);
        }
        else {
            check = k.sub(check);
        }
        assert(check < (token_reserves.add(eth_reserves).add(1)));
        k = check;
    }


    // Function swapETHForTokens: Swaps ETH for your tokens.
    // ETH is sent to contract as msg.value.
    // You can change the inputs, or the scope of your function, as needed.
    function swapETHForTokens(uint maxTokenPriceTolerated)
        external
        payable 
    {
        /******* TODO Implement this function *******/
        /* HINTS:
            Calculate amount of your tokens should be swapped based on exchange rate.
            Transfer the amount of your tokens to the provider.
            If performing the swap would exhaus total token supply, transaction must fail.
            Update token_reserves and eth_reserves.

            Part 4: 
                Expand the function to take in addition parameters as needed.
                If current exchange_rate > slippage limit, abort the swap. 
            
            Part 5: 
                Only exchange amountTokens * (1 - %liquidity), 
                    where % is sent to liquidity providers.
                Keep track of the liquidity fees to be added.
        */
        
        //assume that the sender actaully does have this much eth. 

        // emit Debug('msg.value = ', msg.value);
        
        require(priceToken() < maxTokenPriceTolerated.mul(multiplier), "the price of the token has exceeded the allowed range");
        
        uint price_of_eth = priceETH();


        uint tokens = (msg.value.mul(price_of_eth)).div(multiplier);
        // uint tokens = k.div(eth_reserves.add(msg.value));
        

        require(tokens < token_reserves, "Performing the swap would exhaust total token supply");
        
        //Send the sender their FinnCoin
        //Should use transferFrom here?
        token.transfer(msg.sender, tokens);

        //bookkeeping 
        token_reserves = token_reserves.sub(tokens);
        eth_reserves = eth_reserves.add(msg.value);
        k = token_reserves.mul(eth_reserves);
            


        /**************************/
        // DO NOT MODIFY BELOW THIS LINE
        /* Check for x * y == k, assuming x and y are rounded to the nearest integer. */
        // Check for Math.abs(token_reserves * eth_reserves - k) < (token_reserves + eth_reserves + 1));
        //   to account for the small decimal errors during uint division rounding.
        uint check = token_reserves.mul(eth_reserves);
        if (check >= k) {
            check = check.sub(k);
        }
        else {
            check = k.sub(check);
        }
        assert(check < (token_reserves.add(eth_reserves).add(1)));
        k = check;
    }

    /***  Define helper functions for swaps here as needed: ***/

}
