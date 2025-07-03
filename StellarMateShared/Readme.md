# Shared codebase for StellarMate App and Ekoslive web app 

## How to use

For adding this repo as a git submodule dependency run the command below:

```plaintext
git submodule add <link_to_repo>
```
```
Automatically fetch the latest code from StellarMateShared repo
git config --global submodule.recurse true
```
For fetch this repo run the following command:
```plaintext
cd StellarMateShared
git fetch
git pull

In case if git pull does not work.
Use: git pull origin main
```

If this code is running in the React Native environment, add the `REACT_APP_MODE` variable to your .env file with value `0`.
If this code is running in the web environment, add the `REACT_APP_MODE` variable to your .env file with value `1`.


## Contents

```
Use StellarMateShared as @common i.e import {SelectTrainDevice} from '@common/redux/selectors'
```

The repository is structured as follows:

- **`images/`**: Contains the shared images.
- **`sounds/`**: Contains the shared sounds.
- **`shared/`**: Contains the source code of shared files.
- **`shared/commands`**: Contains shared commands for websockets.
- **`shared/i18n`**: Contains shared translation strings for both applications.
- **`shared/utils`**: Contains utility files, including API and logs, etc.
- **`shared/redux`**: Contains Redux files, including store, actions, reducers, selectors, and constants.
- **`shared/indi`**:  Contains INDI-related files, including enums, devices, etc.
- **`shared/common`**: Contains files and functions used in both applications.