# EBUSINESS CENTRE

This repository is a submission for the [TypeScript Smart Contract 101](https://dacade.org/communities/icp/challenges/256f0a1c-5f4f-495f-a1b3-90559ab3c51f) challenge by the Internet Computer community on [Dacade](https://dacade.org/).

## Overview

This project is a canister implementation for the Internet Computer Protocol (ICP), designed to facilitate ebusiness. It allows users to list their business and items their are actually selling and buyers can buy those items and also give feedbacks about the product they have acually bought.
### Roles and functionalities

The canister is designed with a multi-role system to facilitate various operations and interactions within the ebusiness center ecosystem. Below are the roles defined within the system and the functionalities assigned to each.

#### User

- **Register a business**: user can register his or her business on ebusiness platform and add items,price their location among others details.The system can allow to the seller to take down the product he is currently selling.Once the buyer buys seller product the system will credit sellers acoount


#### Buyer

- **Buyer**: Buyer can login on ebusiness and search for a certain item using item id and the system will check if buyer has enougjh tokens to proceed with transactions if has enough tokens buyer can purchase the product and product get labelled as sold.Also buyer can give comments about the product he/she has bought nad also rate the product.
THe system prevent seller from actually rating his product and alo commenting or buying the product he has actually listed.

## Getting started

Follow the steps below to set up and run the project locally.

### Prerequisites

- Node.js (v18 or later)
- DFX (v0.15.1 or later)

### Installation

1. Clone this repository:

```bash
git clone https://github.com/7144samuelG/icp-ebusiness-center
```

2. Navigate to the project directory:

```bash
cd icp-ebusiness-center
```

3. `dfx` is the tool you will use to interact with the IC locally and on mainnet. If you don't already have it installed:

```bash
npm run dfx_install
```

### Quickstart

Install dependencies, create identities, start a replica, and deploy a canister:

```bash
npm run canister_setup
```

### Interacting With Canister

The `package.json` file contains several commands starting with `canister_call` that can be used to interact with the canister.

### Tear Down

Uninstall the canister, stop the replica, remove identities, and remove dependencies:

```bash
npm run clean_state
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues to suggest improvements or add new features.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.