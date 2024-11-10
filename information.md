# Pera Challenge Submission

This is a Next JS application with the following functionality:

- Wallet connection using Pera Wallet.
- Mainnet and Testnet toggle for switching between the algorand mainnet and testnet.
- A list displaying all verified assets on either the testnet or mainnet depending on which network is being used. Infinite scroll is also implemented for retrieving more assets as user scrolls.
- Asset Opt-in transaction for opting into Assets the currently connected wallet has not opted into yet.
- Donation functionality for donating 1 Algo to a provided wallet address.
- Atomic swap feature for swapping one asset for another on the testnet or mainnet.

## How to run the application

In order to run the application, you need to first install dependencies using the following command

`yarn install` or `npm install`

After installing dependencies successfully, you can run the following command to start the application:

`yarn dev` or `npm run dev`

## Code Deep-dive

### Global State Management

For global state management, [Recoil](https://recoiljs.org/) was used. Four (4) global states were created and used in this application, namely:

1. **Address**: This state holds the address of the currently active address connected to the application.

2. **Accounts**: This state holds a string array of all the accounts connected to the application.

3. **Network**: This state holds the value of the currently active network of the application. It has two possible values: 'Testnet' and 'Mainnet'.

4. **Refresh wallet**: This state represents an integer value that triggers a re-fetch of the wallet balance of the active address when its value changes. Its value gets updated after every successful transaction to ensure real-time update of the user's wallet balance.

To see the global states, refer to the `/src/state/wallet.atom.ts` file.

### Hooks

Three important hooks were written for performing important functionality in the application namely:

1. **useAlgoClientConfig**: This hook uses the currently selected network (testnet or mainnet) to create an algod client for creating and submitting transactions.

2. **useClient**: This hook creates an object that contains methods for easily making and managing API calls.

3. **usePeraWallet**: This hook manages the functionality for connecting, disconnecting and reconnecting a user's wallet to the application using PeraWallet Connect. It also provides the address of the currently connected account. Multiple accounts can be connected to the application at once but only one is active.

All three hooks can be found in the `/src/hooks` folder.

### Styling

For styling purposes, a combination of [Sass](https://sass-lang.com/) and [Tailwind CSS](https://tailwindcss.com/) were used.

### Key Components

In this application, a good number of components were created for different purposes, but the key components in order of their hierarchy in the DOM tree include

1. **Home Component**: This component houses the entire home page. All other components are rendered within it. It can be found in the `/src/features/home/index.ts` file.

2. **Navbar Component**: This component represents the top navigation bar of the application. It contains the button for connecting wallets and also displays the currently connected wallet. It also houses the toggle for switching between mainnet and testnet, and the button for donating algos to a hard-coded address. It can be found in the `/src/components/navbar/index.ts` file.

3. **Assets Component**: This component displays all the verified assets gotten from the Public Pera API for retrieving assets. It can be found in the `/src/features/home/assets/index.ts` file. An Intersecion Observer was used in this component to detect when a user scrolls to the bottom of the assets list so that more assets can be retrieved and displayed on the list. This is because the API endpoint that retrieves the assets returns a paginated list.

4. **Asset Card Component**: This component displays a single asset and also contains functionality for opting the user into the asset if the user is not opted in already. It can be found in the `/src/features/home/assets/asset-card.ts` file.

5. **Atomic Swap Component**: This is the most complicated component and renders the form for providing the details required for a simple atomic swap. It also contains all the logic for the atomic swap. It can be found in the `/src/features/home/atomic-swap/index.ts` file.
