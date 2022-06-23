# Build

`npm install` to install, and then `npm run server` and `npm run client` to run the server and client respectively.

# Usage

The [Phantom Wallet](https://phantom.app/) is required to use the app.

(1) With the app running, open (http://localhost:3000/). The page will display several errors, but these can be dismissed by clicking the white X in the upper right. Click the connect button, which should open Phantom and prompt you to enter your password.

(2) Assuming the associated wallet has not already created a candy machine, the creation form will appear. Fill out the fields, and then click "Deploy." The candy machine creation process is too heavy to fit in a single transaction, so you will be asked to sign twice. If you do not have sufficient funds in your account, these transactions may fail.

(3) You should be redirected to the view contract page, where you can mint the token from the contract by clicking on the Mint button. On a successful mint, a new window opens displaying the token in the Solana explorer. Only one mint is allowed, so subsequent mints will throw an error.

# Program flow

The numbers in this section correspond to the numbers in the section above.

(1) Connection is handled via various Solana imports (lines 5-7 in `src/App.jsx`). The WalletDialogProvider has the advantage of being easy to use and supporting basically every Solana wallet, but the downside of having built-in styling.

(2) `src/views/Home.jsx` calls the createCandyMachine function in `src/web3/utils.js`, which handles the rest.

(3) `src/views/ViewContract.jsx` calls `getCandyMachineState` and `mintOneToken` from the `src/web3/metaplex/` files, which were ripped directly from the metaplex example repository. They use a different underlying structure and connection than the rest of the repository, so ultimately it will probably be better to convert their code to use `@solana/wallet-adapter-react` or convert our code to use `@project-serum/anchor`.

# Areas for improvement

- Fix the error messages that pop up every time the page reloads.
- Detecting and warning the user if they don't have Phantom installed.
- Error checking for common errors (e.g. user does not have enough SOL to run transaction).
- Allow people other than the candy machine creator to mint NFTs.
- Extra creator features
	- Specify additional candy machine settings (start/end date, whitelist, gatekeeper, payment token, etc.)
	- Update candy machine specs after creation.
	- Withdraw funds after the candy machine has minted out.
	- Sign the collection after mint to make it valid.
- Upload multiple different images and metadata, and set with `addConfigLines`.
- Better way to mint a singular NFT without having to create a candy machine?
- Minting a single or a collection of semi-fungible tokens (with or without candy machine?).
